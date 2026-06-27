import * as cheerio from 'cheerio';
import { BaseCrawler } from './base.js';

/**
 * Crawler for WordPress sites using event plugins like
 * "The Events Calendar", "Events Manager", or similar.
 * Many independent bookshops use WordPress with these plugins.
 */
export class WordPressEventsCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
  }

  async crawl(source) {
    try {
      // Strategy 1: Try WP REST API for The Events Calendar (TEC)
      const apiEvents = await this.tryRestApi(source);
      if (apiEvents.length > 0) return apiEvents;

      // Strategy 2: Fall back to HTML scraping
      const html = await this.fetch(source.eventsUrl);
      return await this.extractEvents(html, source);
    } catch (error) {
      console.error(`[${source.id}] WordPress crawler error: ${error.message}`);
      return [];
    }
  }

  /**
   * Try The Events Calendar REST API endpoint.
   */
  async tryRestApi(source) {
    const events = [];
    try {
      const baseUrl = new URL(source.website).origin;
      const apiUrl = `${baseUrl}/wp-json/tribe/events/v1/events?per_page=50&start_date=now`;

      await this.rateLimit();
      this.diagnostics.requestCount++;

      const response = await this.fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;
      if (data.events && Array.isArray(data.events)) {
        for (const event of data.events) {
          const venue = event.venue || {};
          events.push({
            title: event.title || '',
            description: this.stripHtml(event.description || event.excerpt || ''),
            date: event.start_date || event.utc_start_date || '',
            endDate: event.end_date || event.utc_end_date || '',
            url: event.url || source.eventsUrl,
            location: {
              name: venue.venue || source.name,
              address: [venue.address, venue.zip, venue.city].filter(Boolean).join(', '),
            },
            price: {
              amount: event.cost ? parseFloat(event.cost.replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0,
              currency: 'EUR',
            },
            source: source.name,
            sourceId: source.id,
          });
        }
        this.diagnostics.successCount++;
      }
    } catch {
      // API not available, that's fine - fall back to HTML
    }
    return events;
  }

  async extractEvents(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    // The Events Calendar HTML selectors
    const tecSelectors = [
      '.tribe-events-calendar-list__event',
      '.tribe_events', '.type-tribe_events',
      '.tribe-events-single', '.tribe-events-list .type-tribe_events',
    ];

    for (const selector of tecSelectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('.tribe-events-calendar-list__event-title, h2, h3, .tribe-events-list-event-title')
          .first().text().trim();
        if (!title) return;

        const dateText = $el.find('time, .tribe-event-schedule-details, .tribe-events-schedule')
          .first().attr('datetime') ||
          $el.find('time, .tribe-event-schedule-details').first().text().trim();

        const link = $el.find('a[href]').first().attr('href') || '';
        const venue = $el.find('.tribe-events-calendar-list__event-venue, .tribe-venue, .tribe-events-venue-details')
          .first().text().trim();

        events.push({
          title,
          description: $el.find('.tribe-events-calendar-list__event-description, .tribe-events-list-event-description, p')
            .first().text().trim(),
          date: dateText,
          url: link || source.eventsUrl,
          location: {
            name: venue || source.name,
            address: $el.find('.tribe-venue-location, .tribe-address').first().text().trim(),
          },
          price: {
            amount: this.extractPrice($el.find('.tribe-events-cost, .ticket-cost').first().text()),
            currency: 'EUR',
          },
          source: source.name,
          sourceId: source.id,
        });
      });

      if (events.length > 0) return events;
    }

    // Events Manager plugin selectors
    const emSelectors = [
      '.event-single', '.em-event', '.event',
    ];

    for (const selector of emSelectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, .event-title, .entry-title').first().text().trim();
        if (!title) return;

        events.push({
          title,
          description: $el.find('.event-description, .entry-content, p').first().text().trim(),
          date: $el.find('time, .event-date, .date').first().attr('datetime') ||
                $el.find('time, .event-date, .date').first().text().trim(),
          url: $el.find('a[href]').first().attr('href') || source.eventsUrl,
          location: {
            name: $el.find('.event-location, .location').first().text().trim() || source.name,
            address: '',
          },
          price: { amount: 0, currency: 'EUR' },
          source: source.name,
          sourceId: source.id,
        });
      });

      if (events.length > 0) return events;
    }

    // Generic WordPress event patterns
    $('article, .post, .entry').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .entry-title').first().text().trim();
      if (!title) return;

      // Check if it looks like an event (has date-like content)
      const text = $el.text();
      if (!/\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}|Uhr|veranstaltung|lesung/i.test(text)) return;

      events.push({
        title,
        description: $el.find('.entry-content, .excerpt, p').first().text().trim(),
        date: $el.find('time, .date, .event-date').first().attr('datetime') ||
              $el.find('time, .date, .event-date').first().text().trim(),
        url: $el.find('a[href]').first().attr('href') || source.eventsUrl,
        location: { name: source.name, address: '' },
        price: { amount: 0, currency: 'EUR' },
        source: source.name,
        sourceId: source.id,
      });
    });

    return events;
  }

  /**
   * Extract price from text like "12,00 €" or "Eintritt: 8 Euro".
   */
  extractPrice(text) {
    if (!text) return 0;
    const match = text.match(/(\d+[.,]?\d*)\s*(?:€|EUR|Euro)/i);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  }

  /**
   * Strip HTML tags from a string.
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
