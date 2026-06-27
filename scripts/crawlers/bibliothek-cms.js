import * as cheerio from 'cheerio';
import { BaseCrawler } from './base.js';

/**
 * Crawler for German municipal library (Bibliothek) CMS systems.
 * Many German Stadtbibliotheken use similar CMS patterns for event pages,
 * often with structured listings using date headers and event details.
 */
export class BibliothekCmsCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
  }

  async extractEvents(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    // Strategy 1: JSON-LD (some modern library sites use it)
    const jsonLdEvents = this.extractJsonLd($, source);
    if (jsonLdEvents.length > 0) return jsonLdEvents;

    // Strategy 2: Structured event containers (most common for library CMS)
    const containerEvents = this.extractContainers($, source);
    if (containerEvents.length > 0) return containerEvents;

    // Strategy 3: Table-based listings (older library sites)
    const tableEvents = this.extractTables($, source);
    if (tableEvents.length > 0) return tableEvents;

    // Strategy 4: Generic heading + content pattern
    return this.extractHeadingPattern($, source);
  }

  extractJsonLd($, source) {
    const events = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
        for (const item of items) {
          if (item['@type'] === 'Event') {
            const loc = item.location || {};
            const addr = loc.address || {};
            events.push({
              title: item.name || '',
              description: item.description || '',
              date: item.startDate || '',
              endDate: item.endDate || '',
              url: item.url || source.eventsUrl,
              location: {
                name: loc.name || source.name,
                address: typeof addr === 'string' ? addr :
                  [addr.streetAddress, addr.postalCode, addr.addressLocality].filter(Boolean).join(', '),
              },
              price: { amount: 0, currency: 'EUR' },
              source: source.name,
              sourceId: source.id,
            });
          }
        }
      } catch {
        // Ignore
      }
    });
    return events;
  }

  extractContainers($, source) {
    const events = [];
    const selectors = [
      '.veranstaltung', '.event', '.termin', '.event-item',
      '.veranstaltungen-item', '.veranstaltung-teaser',
      'article.event', '.kalender-eintrag', '.va-item',
      '[class*="veranstaltung"]', '[class*="event-list"]',
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, .titel, .headline, .va-title')
          .first().text().trim();
        if (!title) return;

        // Extract date - try multiple attributes and elements
        const dateText = $el.find('time').attr('datetime') ||
          $el.find('.date, .datum, .termin-datum, time, [class*="date"]').first().text().trim();

        const link = $el.find('a[href]').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link :
          (link ? new URL(link, source.website).href : source.eventsUrl);

        const locationText = $el.find('.location, .ort, .bibliothek, .standort')
          .first().text().trim();

        const descText = $el.find('.description, .beschreibung, .text, .teaser-text, p')
          .first().text().trim();

        // Try to detect audience info from classes or text
        const audienceText = $el.find('.zielgruppe, .alter, .target, [class*="audience"]')
          .first().text().trim();

        events.push({
          title,
          description: descText,
          date: dateText,
          url: fullUrl,
          location: {
            name: locationText || source.name,
            address: $el.find('.address, .adresse').first().text().trim(),
          },
          price: { amount: 0, currency: 'EUR' },
          source: source.name,
          sourceId: source.id,
          _audienceHint: audienceText,
        });
      });

      if (events.length > 0) break;
    }

    return events;
  }

  extractTables($, source) {
    const events = [];
    $('table.events, table.veranstaltungen, table[class*="event"]').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        if (cells.length < 2) return;

        const dateText = $(cells[0]).text().trim();
        const title = $(cells[1]).text().trim();
        if (!title || !dateText) return;

        const link = $row.find('a[href]').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link :
          (link ? new URL(link, source.website).href : source.eventsUrl);

        events.push({
          title,
          description: cells.length > 2 ? $(cells[2]).text().trim() : '',
          date: dateText,
          url: fullUrl,
          location: { name: source.name, address: '' },
          price: { amount: 0, currency: 'EUR' },
          source: source.name,
          sourceId: source.id,
        });
      });
    });
    return events;
  }

  extractHeadingPattern($, source) {
    const events = [];
    // Look for date headings followed by event content
    $('h2, h3, h4').each((_, heading) => {
      const $heading = $(heading);
      const headingText = $heading.text().trim();

      // Check if heading looks like a date or event title
      const isDate = /\d{1,2}[\.\-]\s*\d{1,2}[\.\-]\s*\d{2,4}|\d{1,2}\.\s*[A-Za-zäöüÄÖÜ]+/.test(headingText);
      
      if (isDate) {
        // Heading is a date, next sibling(s) are event details
        const $next = $heading.next();
        const title = $next.find('a, strong, b').first().text().trim() || $next.text().trim();
        if (title && title.length > 3) {
          const link = $next.find('a[href]').first().attr('href') || '';
          events.push({
            title,
            description: '',
            date: headingText,
            url: link ? new URL(link, source.website).href : source.eventsUrl,
            location: { name: source.name, address: '' },
            price: { amount: 0, currency: 'EUR' },
            source: source.name,
            sourceId: source.id,
          });
        }
      } else if (headingText.length > 5 && headingText.length < 200) {
        // Heading might be an event title
        const $parent = $heading.parent();
        const dateEl = $parent.find('.date, .datum, time').first();
        const dateText = dateEl.attr('datetime') || dateEl.text().trim();
        if (dateText) {
          events.push({
            title: headingText,
            description: $parent.find('p').first().text().trim(),
            date: dateText,
            url: $parent.find('a[href]').first().attr('href') || source.eventsUrl,
            location: { name: source.name, address: '' },
            price: { amount: 0, currency: 'EUR' },
            source: source.name,
            sourceId: source.id,
          });
        }
      }
    });

    return events;
  }
}
