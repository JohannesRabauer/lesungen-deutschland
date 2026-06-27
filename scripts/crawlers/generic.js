import * as cheerio from 'cheerio';
import { BaseCrawler } from './base.js';

/**
 * Generic crawler that extracts events using multiple strategies:
 * 1. JSON-LD structured data (Schema.org Event)
 * 2. Schema.org microdata
 * 3. Common HTML patterns for German event listings
 */
export class GenericCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
  }

  async extractEvents(html, source) {
    const events = [];

    // Strategy 1: JSON-LD structured data
    const jsonLdEvents = this.extractJsonLd(html, source);
    if (jsonLdEvents.length > 0) {
      events.push(...jsonLdEvents);
      return events;
    }

    // Strategy 2: Schema.org microdata
    const microdataEvents = this.extractMicrodata(html, source);
    if (microdataEvents.length > 0) {
      events.push(...microdataEvents);
      return events;
    }

    // Strategy 3: Common HTML patterns
    const htmlEvents = this.extractHtmlPatterns(html, source);
    events.push(...htmlEvents);

    return events;
  }

  /**
   * Extract events from JSON-LD script tags.
   */
  extractJsonLd(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // Handle @graph arrays
          const graphItems = item['@graph'] ? item['@graph'] : [item];
          for (const graphItem of graphItems) {
            if (graphItem['@type'] === 'Event' || graphItem['@type'] === 'LiteraryEvent') {
              events.push(this.mapJsonLdEvent(graphItem, source));
            }
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    });

    return events.filter(Boolean);
  }

  /**
   * Map a JSON-LD Event object to our raw event format.
   */
  mapJsonLdEvent(item, source) {
    const location = item.location || {};
    const address = location.address || {};
    const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;

    return {
      title: item.name || '',
      description: item.description || '',
      date: item.startDate || '',
      endDate: item.endDate || '',
      url: item.url || source.eventsUrl,
      location: {
        name: typeof location === 'string' ? location : (location.name || ''),
        address: typeof address === 'string' ? address : (
          [address.streetAddress, address.postalCode, address.addressLocality]
            .filter(Boolean).join(', ')
        ),
      },
      price: {
        amount: offers?.price ? parseFloat(offers.price) : 0,
        currency: offers?.priceCurrency || 'EUR',
      },
      source: source.name,
      sourceId: source.id,
    };
  }

  /**
   * Extract events from Schema.org microdata attributes.
   */
  extractMicrodata(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    $('[itemtype*="schema.org/Event"]').each((_, el) => {
      const $el = $(el);
      events.push({
        title: $el.find('[itemprop="name"]').text().trim(),
        description: $el.find('[itemprop="description"]').text().trim(),
        date: $el.find('[itemprop="startDate"]').attr('content') ||
              $el.find('[itemprop="startDate"]').text().trim(),
        endDate: $el.find('[itemprop="endDate"]').attr('content') || '',
        url: $el.find('[itemprop="url"]').attr('href') || source.eventsUrl,
        location: {
          name: $el.find('[itemprop="location"] [itemprop="name"]').text().trim() ||
                $el.find('[itemprop="location"]').text().trim(),
          address: $el.find('[itemprop="address"]').text().trim(),
        },
        price: {
          amount: parseFloat($el.find('[itemprop="price"]').attr('content') || '0'),
          currency: $el.find('[itemprop="priceCurrency"]').attr('content') || 'EUR',
        },
        source: source.name,
        sourceId: source.id,
      });
    });

    return events.filter((e) => e.title);
  }

  /**
   * Extract events from common HTML patterns in German event pages.
   */
  extractHtmlPatterns(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    // Common patterns: articles, list items, or divs with event-like classes
    const selectors = [
      'article.event', '.event-item', '.veranstaltung',
      '.event-list-item', '.event-entry', '.veranstaltungen-item',
      '[class*="event"]', '[class*="veranstaltung"]',
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, .event-title').first().text().trim();
        if (!title) return;

        const dateText = $el.find('.date, .event-date, time, [datetime]').first()
          .attr('datetime') || $el.find('.date, .event-date, time').first().text().trim();

        const link = $el.find('a').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link :
          (link ? new URL(link, source.website).href : source.eventsUrl);

        events.push({
          title,
          description: $el.find('.description, .event-description, p').first().text().trim(),
          date: dateText,
          url: fullUrl,
          location: {
            name: $el.find('.location, .venue, .ort').first().text().trim() || source.name,
            address: $el.find('.address, .adresse').first().text().trim(),
          },
          price: { amount: 0, currency: 'EUR' },
          source: source.name,
          sourceId: source.id,
        });
      });

      if (events.length > 0) break; // Use first matching selector pattern
    }

    return events;
  }
}
