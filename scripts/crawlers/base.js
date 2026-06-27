import axios from 'axios';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
];

/**
 * Base crawler class providing HTTP fetch, retries, rate limiting,
 * and error handling. Subclasses must implement extractEvents(html, source).
 */
export class BaseCrawler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 30000;
    this.retryDelay = options.retryDelay ?? 2000;
    this.rateLimitMs = options.rateLimitMs ?? 1500;
    this.lastRequestTime = 0;
    this.diagnostics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  /**
   * Get a random User-Agent string.
   */
  getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Wait to respect rate limiting.
   */
  async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch a URL with retries and error handling.
   * @param {string} url
   * @param {object} options - Axios request options override
   * @returns {Promise<string>} HTML content
   */
  async fetch(url, options = {}) {
    await this.rateLimit();
    this.diagnostics.requestCount++;

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': this.getRandomUserAgent(),
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
