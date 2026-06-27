import axios from 'axios';
import { BOT_USER_AGENT, isAllowed, getCrawlDelay } from '../robots.js';

/**
 * Raised when robots.txt disallows a URL. Callers treat this as
 * "skip this source" rather than a hard error.
 */
export class RobotsDisallowedError extends Error {
  constructor(url) {
    super(`Disallowed by robots.txt: ${url}`);
    this.name = 'RobotsDisallowedError';
    this.url = url;
  }
}

/**
 * Base crawler class providing HTTP fetch, retries, rate limiting,
 * robots.txt compliance, and error handling.
 * Subclasses must implement extractEvents(html, source).
 */
export class BaseCrawler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 30000;
    this.retryDelay = options.retryDelay ?? 2000;
    // Conservative default rate limit; raised vs. previous 1500ms to be a
    // polite, low-volume crawler. Overridden upward by robots Crawl-delay.
    this.rateLimitMs = options.rateLimitMs ?? 3000;
    this.lastRequestTime = 0;
    this.diagnostics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  /**
   * The single, honest, identifiable User-Agent used for every request.
   * We do not rotate or spoof browser User-Agents.
   */
  getUserAgent() {
    return BOT_USER_AGENT;
  }

  /**
   * Wait to respect rate limiting. Honors a robots.txt Crawl-delay when set.
   */
  async rateLimit(url) {
    let delayMs = this.rateLimitMs;
    if (url) {
      try {
        const crawlDelay = await getCrawlDelay(url);
        if (crawlDelay) delayMs = Math.max(delayMs, crawlDelay * 1000);
      } catch {
        // Ignore robots lookup issues for rate limiting.
      }
    }

    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < delayMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch a URL with retries, robots.txt compliance, and error handling.
   * @param {string} url
   * @param {object} options - Axios request options override
   * @returns {Promise<string>} HTML content
   */
  async fetch(url, options = {}) {
    if (!(await isAllowed(url))) {
      throw new RobotsDisallowedError(url);
    }

    await this.rateLimit(url);
    this.diagnostics.requestCount++;

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': this.getUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
            ...options.headers,
          },
          maxRedirects: 5,
          ...options,
        });

        this.diagnostics.successCount++;
        return response.data;
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        // Don't retry on 4xx errors (except 429)
        if (status && status >= 400 && status < 500 && status !== 429) {
          break;
        }
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.diagnostics.errorCount++;
    const errorMsg = lastError?.message || 'Unknown error';
    this.diagnostics.errors.push({ url, error: errorMsg });
    throw new Error(`Failed to fetch ${url}: ${errorMsg}`);
  }

  /**
   * Extract events from HTML content. Must be overridden by subclasses.
   * @param {string} html - The HTML content to parse
   * @param {object} source - The source registry entry
   * @returns {Promise<Array>} Array of raw event objects
   */
  async extractEvents(html, source) {
    throw new Error('extractEvents() must be implemented by subclass');
  }

  /**
   * Run the crawler for a given source.
   * @param {object} source - Source registry entry
   * @returns {Promise<Array>} Array of raw event objects
   */
  async crawl(source) {
    try {
      const html = await this.fetch(source.eventsUrl);
      const events = await this.extractEvents(html, source);
      return events;
    } catch (error) {
      if (error instanceof RobotsDisallowedError) {
        console.warn(`[${source.id}] Skipped: robots.txt disallows ${error.url}`);
        this.diagnostics.errors.push({ url: error.url, error: 'robots.txt disallow' });
        return [];
      }
      console.error(`[${source.id}] Crawler error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get diagnostics for this crawler run.
   */
  getDiagnostics() {
    return { ...this.diagnostics };
  }
}
