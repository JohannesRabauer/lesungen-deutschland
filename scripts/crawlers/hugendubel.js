import * as cheerio from 'cheerio';
import { BaseCrawler } from './base.js';

/**
 * Hugendubel event crawler.
 * Hugendubel uses server-rendered HTML with event listing pages.
 */
export class HugendubelCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
  }

  async extractEvents(html, source) {
    const events = [];
    const $ = cheerio.load(html);

    // Hugendubel typically lists events in card/article containers
    const selectors = [
      '.event-teaser', '.event-item', '.veranstaltung-item',
      'article[class*="event"]', '.events-list .item',
      '[class*="event-card"]', '.teaser',
    ];

    let matched = false;
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;
      matched = true;

      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, .headline').first().text().trim();
        if (!title) return;

        const dateText = $el.find('time, .date, [class*="date"]').first()
          .attr('datetime') || $el.find('time, .date, [class*="date"]').first().text().trim();

        const link = $el.find('a[href]').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link :
          (link ? `https://www.hugendubel.de${link}` : source.eventsUrl);

        const locationText = $el.find('.location, .filiale, .ort, [class*="location"]')
          .first().text().trim();

        events.push({
          title,
          description: $el.find('.description, .text, p').first().text().trim(),
          date: dateText,
          url: fullUrl,
          location: {
            name: locationText || source.name,
            address: $el.find('.address, .adresse').first().text().trim(),
          },
          price: { amount: 0, currency: 'EUR' },
          source: source.name,
          sourceId: source.id,
        });
      });

      if (matched) break;
    }

    // Fallback: try JSON-LD
    if (events.length === 0) {
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
          // Ignore invalid JSON
        }
      });
    }

    return events;
  }
}
