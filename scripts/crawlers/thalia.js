import puppeteer from 'puppeteer';
import { BaseCrawler } from './base.js';

/**
 * Thalia crawler using Puppeteer for JavaScript-rendered content.
 * Migrated from the original scripts/sources/thalia.js.
 */
export class ThaliaCrawler extends BaseCrawler {
  constructor(options = {}) {
    super({ ...options, timeout: 60000 });
  }

  /**
   * Override crawl() to use Puppeteer instead of axios.
   */
  async crawl(source) {
    let browser;
    try {
      await this.rateLimit();
      this.diagnostics.requestCount++;

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      await page.goto(source.eventsUrl, { waitUntil: 'networkidle2', timeout: this.timeout });

      // Handle cookie consent if present
      try {
        await page.waitForSelector('#usercentrics-root', { timeout: 3000 });
        const frame = page.frames().find(f => f.url().includes('usercentrics'));
        if (frame) {
          const acceptBtn = await frame.$('button[data-testid="uc-accept-all-button"]');
          if (acceptBtn) await acceptBtn.click();
        }
      } catch {
        // No cookie banner, continue
      }

      // Wait for content to load
      await page.waitForTimeout(2000);

      const rawEvents = await page.evaluate(() => {
        const eventsList = [];
        // Try multiple strategies to find events on the page
        
        // Strategy 1: Look for event cards/containers
        const containers = document.querySelectorAll(
          '[class*="event"], [class*="Event"], article, .veranstaltung'
        );

        containers.forEach((container) => {
          const titleEl = container.querySelector('h2, h3, h4, [class*="title"]');
          const dateEl = container.querySelector('time, [class*="date"], [class*="Date"]');
          const linkEl = container.querySelector('a[href]');
          const descEl = container.querySelector('p, [class*="desc"], [class*="text"]');
          const locationEl = container.querySelector('[class*="location"], [class*="ort"], [class*="filiale"]');

          if (titleEl && titleEl.textContent.trim()) {
            eventsList.push({
              title: titleEl.textContent.trim(),
              dateStr: dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || '',
              description: descEl?.textContent?.trim() || '',
              link: linkEl?.getAttribute('href') || '',
              locationStr: locationEl?.textContent?.trim() || '',
            });
          }
        });

        // Strategy 2: Fallback - look for heading-based structure
        if (eventsList.length === 0) {
          const headings = document.querySelectorAll('h3, h4');
          headings.forEach((heading) => {
            let current = heading.nextElementSibling;
            let dateStr = '';
            let locationStr = '';
            let description = '';
            let link = '';

            // Walk siblings until next heading
            while (current && !['H2', 'H3', 'H4'].includes(current.tagName)) {
              const text = current.textContent?.trim() || '';
              if (current.tagName === 'A' && !link) {
                link = current.getAttribute('href') || '';
              }
              if (text.match(/\d{1,2}[\.\-\/]\s*\d{1,2}[\.\-\/]\s*\d{2,4}|\d{1,2}\.\s+[A-Za-zäöüÄÖÜ]+\s+\d{4}/)) {
                dateStr = text;
              } else if (current.tagName === 'SPAN' && !locationStr) {
                locationStr = text;
              } else if (!description && text.length > 20) {
                description = text;
              }
              current = current.nextElementSibling;
            }

            if (heading.textContent.trim()) {
              eventsList.push({
                title: heading.textContent.trim(),
                dateStr,
                description,
                link,
                locationStr,
              });
            }
          });
        }

        return eventsList;
      });

      await browser.close();
      this.diagnostics.successCount++;

      return rawEvents.map((raw) => this.mapRawEvent(raw, source));
    } catch (error) {
      if (browser) await browser.close();
      this.diagnostics.errorCount++;
      this.diagnostics.errors.push({ url: source.eventsUrl, error: error.message });
      console.error(`[${source.id}] Thalia crawler error: ${error.message}`);
      return [];
    }
  }

  /**
   * Map raw extracted data to event format.
   */
  mapRawEvent(raw, source) {
    let url = raw.link || '';
    if (url && !url.startsWith('http')) {
      url = `https://www.thalia.de${url}`;
    }

    return {
      title: raw.title,
      description: raw.description || '',
      date: raw.dateStr,
      url: url || source.eventsUrl,
      location: {
        name: raw.locationStr || source.name,
        address: raw.locationStr || '',
      },
      price: { amount: 0, currency: 'EUR' },
      source: source.name,
      sourceId: source.id,
    };
  }

  // Not used directly since we override crawl(), but required by base class contract
  async extractEvents(html, source) {
    return [];
  }
}
