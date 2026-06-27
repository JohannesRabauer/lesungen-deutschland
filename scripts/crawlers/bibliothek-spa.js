import puppeteer from 'puppeteer';
import { BaseCrawler, RobotsDisallowedError } from './base.js';
import { BibliothekCmsCrawler } from './bibliothek-cms.js';
import { isAllowed } from '../robots.js';

/**
 * Crawler for JavaScript-rendered library event calendars.
 *
 * Many modern Stadtbibliothek / Landesbibliothek sites (e.g. the ZLB Berlin)
 * render their event listings client-side, so a plain HTTP+cheerio fetch sees
 * an empty shell. This crawler renders the page with Puppeteer, auto-scrolls to
 * trigger lazy loading, and then REUSES the exact same extraction strategies as
 * the static {@link BibliothekCmsCrawler} (JSON-LD → containers → tables →
 * headings). Only the "get the HTML" step differs.
 *
 * It honours robots.txt and uses the single honest bot User-Agent, just like
 * the HTTP crawlers.
 */
export class BibliothekSpaCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
    // Delegate extraction to the static CMS crawler so the parsing logic lives
    // in exactly one place.
    this.extractor = new BibliothekCmsCrawler(options);
    this.navTimeout = options.navTimeout ?? 45000;
  }

  async extractEvents(html, source) {
    return this.extractor.extractEvents(html, source);
  }

  async crawl(source) {
    // Respect robots.txt before launching a browser.
    try {
      if (!(await isAllowed(source.eventsUrl))) {
        throw new RobotsDisallowedError(source.eventsUrl);
      }
    } catch (error) {
      if (error instanceof RobotsDisallowedError) {
        console.warn(`[${source.id}] Skipped: robots.txt disallows ${error.url}`);
        this.diagnostics.errors.push({ url: error.url, error: 'robots.txt disallow' });
        return [];
      }
    }

    await this.rateLimit(source.eventsUrl);

    let browser;
    try {
      this.diagnostics.requestCount++;
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setUserAgent(this.getUserAgent());
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'de-DE,de;q=0.9' });

      await page.goto(source.eventsUrl, { waitUntil: 'networkidle2', timeout: this.navTimeout });

      // Best-effort cookie dismissal (don't fail if absent).
      try {
        await page.evaluate(() => {
          const labels = ['alle akzeptieren', 'akzeptieren', 'einverstanden', 'zustimmen', 'accept all'];
          const btns = Array.from(document.querySelectorAll('button, a'));
          const hit = btns.find((b) => labels.some((l) => (b.innerText || '').trim().toLowerCase().includes(l)));
          if (hit) hit.click();
        });
      } catch {
        // ignore
      }

      // Auto-scroll to trigger lazy-loaded event teasers.
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let scrolled = 0;
          const timer = setInterval(() => {
            window.scrollBy(0, 800);
            scrolled += 800;
            if (scrolled >= 5000) {
              clearInterval(timer);
              resolve();
            }
          }, 200);
        });
      });
      await new Promise((r) => setTimeout(r, 1500));

      const html = await page.content();
      await browser.close();
      browser = null;

      this.diagnostics.successCount++;
      const events = await this.extractEvents(html, source);
      return events;
    } catch (error) {
      this.diagnostics.errorCount++;
      this.diagnostics.errors.push({ url: source.eventsUrl, error: error.message });
      console.error(`[${source.id}] SPA crawler error: ${error.message}`);
      if (browser) {
        try { await browser.close(); } catch { /* ignore */ }
      }
      return [];
    }
  }
}
