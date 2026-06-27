import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GenericCrawler } from './crawlers/generic.js';
import { ThaliaCrawler } from './crawlers/thalia.js';
import { HugendubelCrawler } from './crawlers/hugendubel.js';
import { BibliothekCmsCrawler } from './crawlers/bibliothek-cms.js';
import { WordPressEventsCrawler } from './crawlers/wordpress-events.js';
import { normalizeEvents, deduplicateEvents, validateEvent } from './normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONCURRENCY_LIMIT = 5;

/**
 * Instantiate the appropriate crawler for a given source.
 */
function getCrawler(crawlerType) {
  switch (crawlerType) {
    case 'thalia':
      return new ThaliaCrawler();
    case 'hugendubel':
      return new HugendubelCrawler();
    case 'bibliothek-cms':
      return new BibliothekCmsCrawler();
    case 'wordpress-events':
      return new WordPressEventsCrawler();
    case 'generic':
    default:
      return new GenericCrawler();
  }
}

/**
 * Run crawlers with concurrency limit.
 */
async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const promise = task().then((result) => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);
    results.push(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.allSettled(results);
}

async function run() {
  console.log('Starting scrape pipeline...');
  const startTime = Date.now();

  // 1. Load source registry
  const registryPath = path.join(__dirname, 'sources', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  const enabledSources = registry.filter((s) => s.enabled);
  console.log(`Loaded ${enabledSources.length} enabled sources from registry.`);

  // 2. Create crawl tasks
  const diagnostics = {
    timestamp: new Date().toISOString(),
    totalSources: enabledSources.length,
    results: [],
  };

  const tasks = enabledSources.map((source) => async () => {
    const crawler = getCrawler(source.crawlerType);
    const sourceStart = Date.now();

    console.log(`[${source.id}] Crawling ${source.name}...`);
    const rawEvents = await crawler.crawl(source);
    const elapsed = Date.now() - sourceStart;

    const diag = {
      sourceId: source.id,
      sourceName: source.name,
      crawlerType: source.crawlerType,
      eventsFound: rawEvents.length,
      durationMs: elapsed,
      success: rawEvents.length > 0 || crawler.getDiagnostics().errorCount === 0,
      errors: crawler.getDiagnostics().errors,
    };
    diagnostics.results.push(diag);

    if (rawEvents.length > 0) {
      console.log(`[${source.id}] Found ${rawEvents.length} events (${elapsed}ms)`);
    } else {
      console.log(`[${source.id}] No events found (${elapsed}ms)`);
    }

    return rawEvents;
  });

  // 3. Run all crawlers with concurrency limit
  const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT);

  // 4. Collect all raw events
  let allRawEvents = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allRawEvents.push(...result.value);
    }
  }
  console.log(`\nTotal raw events collected: ${allRawEvents.length}`);

  // 5. Normalize all events
  let normalizedEvents = normalizeEvents(allRawEvents);
  console.log(`After normalization: ${normalizedEvents.length} events`);

  // 6. Deduplicate
  normalizedEvents = deduplicateEvents(normalizedEvents);
  console.log(`After deduplication: ${normalizedEvents.length} events`);

  // 7. Validate
  let validCount = 0;
  let invalidCount = 0;
  const validEvents = [];

  for (const event of normalizedEvents) {
    const { valid, errors } = validateEvent(event);
    if (valid) {
      validCount++;
      validEvents.push(event);
    } else {
      invalidCount++;
      if (invalidCount <= 5) {
        console.warn(`Invalid event: ${event.title} - ${errors.join(', ')}`);
      }
    }
  }
  console.log(`Validation: ${validCount} valid, ${invalidCount} invalid`);

  // Sort by date
  validEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 8. Write output
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'events.json'), JSON.stringify(validEvents, null, 2));
  console.log(`\nWrote ${validEvents.length} events to public/data/events.json`);

  // 9. Write diagnostics
  const elapsed = Date.now() - startTime;
  diagnostics.totalDurationMs = elapsed;
  diagnostics.totalEventsOutput = validEvents.length;
  diagnostics.successfulSources = diagnostics.results.filter((r) => r.success).length;
  diagnostics.failedSources = diagnostics.results.filter((r) => !r.success).length;

  fs.writeFileSync(
    path.join(__dirname, 'diagnostics.json'),
    JSON.stringify(diagnostics, null, 2)
  );
  console.log(`Diagnostics written to scripts/diagnostics.json`);
  console.log(`\nPipeline complete in ${(elapsed / 1000).toFixed(1)}s`);
}

run().catch((error) => {
  console.error('Fatal pipeline error:', error);
  process.exit(1);
});
