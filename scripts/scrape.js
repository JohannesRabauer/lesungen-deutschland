import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GenericCrawler } from './crawlers/generic.js';
import { ThaliaCrawler } from './crawlers/thalia.js';
import { HugendubelCrawler } from './crawlers/hugendubel.js';
import { BibliothekCmsCrawler } from './crawlers/bibliothek-cms.js';
import { BibliothekSpaCrawler } from './crawlers/bibliothek-spa.js';
import { WordPressEventsCrawler } from './crawlers/wordpress-events.js';
import { normalizeEvents, deduplicateEvents, validateEvent } from './normalize.js';
import { filterLesungen } from './lesung-filter.js';
import { geocodeEvents } from './geocode.js';
import { BOT_USER_AGENT, isAllowed } from './robots.js';
import { generateMockEvents } from './generate-mock-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crawl politeness: keep per-source volume modest. Repeated, systematic
// extraction of large parts of a source's event database can trigger the
// sui-generis database right (UrhG sec. 87a-87e), so we limit concurrency
// and cap how many events we take per source per run.
const CONCURRENCY_LIMIT = 2;
const MAX_EVENTS_PER_SOURCE = 60;
const TARGET_EVENT_COUNT = 50;

function flattenJsonLdNodes(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenJsonLdNodes);
  if (typeof node !== 'object') return [];
  if (node['@graph']) return flattenJsonLdNodes(node['@graph']);

  const nodes = [node];
  if (node.about) nodes.push(...flattenJsonLdNodes(node.about));
  if (node.mainEntity) nodes.push(...flattenJsonLdNodes(node.mainEntity));
  return nodes;
}

function parseDetailEventMetadata($) {
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html() || '');
      const eventNode = flattenJsonLdNodes(data).find((node) => node?.['@type'] === 'Event');
      if (!eventNode) continue;

      const location = eventNode.location || {};
      const address = location.address || {};
      const performer = Array.isArray(eventNode.performer)
        ? eventNode.performer.map((item) => item?.name).filter(Boolean).join(', ')
        : eventNode.performer?.name || '';

      return {
        title: eventNode.name || '',
        description: eventNode.description || '',
        date: eventNode.startDate || '',
        endDate: eventNode.endDate || '',
        author: performer,
        location: {
          name: location.name || '',
          address: typeof address === 'string'
            ? address
            : [address.streetAddress, address.postalCode, address.addressLocality]
              .filter(Boolean)
              .join(', '),
        },
      };
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return null;
}

function needsDetailEnrichment(rawEvent) {
  if (!rawEvent?.url || !rawEvent?.title) return false;

  const titleStartsWithDate = /^\d{1,2}\.\d{1,2}\.\d{2,4}\b/.test(rawEvent.title.trim());
  const descriptionLooksTruncated = /…$|\.\.\.$/.test((rawEvent.description || '').trim());
  const missingCoreFields = !rawEvent.date || !rawEvent.description;

  return missingCoreFields || (titleStartsWithDate && descriptionLooksTruncated);
}

async function enrichEventFromDetailPage(rawEvent) {
  if (!needsDetailEnrichment(rawEvent)) {
    return rawEvent;
  }

  if (!(await isAllowed(rawEvent.url))) {
    return rawEvent;
  }

  try {
    const response = await axios.get(rawEvent.url, {
      timeout: 30000,
      headers: {
        'User-Agent': BOT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const detailMetadata = parseDetailEventMetadata($);
    const contentText = $('main, article, .content, .entry-content, .article-content, .page-content')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const bodyText = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const enrichedDescription = /(?:\bWann\b|\bAm\s+\d{1,2}\.)/i.test(bodyText) ? bodyText : contentText;

    if (!enrichedDescription) {
      return rawEvent;
    }

    return {
      ...rawEvent,
      title: detailMetadata?.title || rawEvent.title,
      description: detailMetadata?.description || enrichedDescription || rawEvent.description,
      date: detailMetadata?.date || rawEvent.date,
      endDate: detailMetadata?.endDate || rawEvent.endDate,
      author: detailMetadata?.author || rawEvent.author,
      location: {
        name: detailMetadata?.location?.name || rawEvent.location?.name || '',
        address: detailMetadata?.location?.address || rawEvent.location?.address || '',
      },
    };
  } catch {
    return rawEvent;
  }
}

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
    case 'bibliothek-spa':
      return new BibliothekSpaCrawler();
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
    const crawled = await crawler.crawl(source);

    // Libraries publish very mixed programmes (workshops, Führungen, Flohmärkte
    // …). When a source opts in (default for the "library" category) we keep
    // only events that look like author readings. Run BEFORE normalization so
    // the classifier can still use the raw description text.
    const onlyLesungen = source.onlyLesungen ?? source.category === 'library';
    const filtered = onlyLesungen && Array.isArray(crawled)
      ? filterLesungen(crawled)
      : crawled;
    const droppedByFilter = Array.isArray(crawled) && Array.isArray(filtered)
      ? crawled.length - filtered.length
      : 0;

    // Cap per-source volume to stay clear of systematic database extraction.
    const rawEvents = Array.isArray(filtered)
      ? filtered
        .slice(0, MAX_EVENTS_PER_SOURCE)
        .map((event) => ({
          ...event,
          source: event.source || source.name,
          sourceId: event.sourceId || source.id,
          sourceCity: event.sourceCity || source.city || '',
        }))
      : [];
    const elapsed = Date.now() - sourceStart;

    const diag = {
      sourceId: source.id,
      sourceName: source.name,
      crawlerType: source.crawlerType,
      onlyLesungen,
      eventsFound: rawEvents.length,
      droppedByLesungFilter: droppedByFilter,
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

  allRawEvents = await Promise.all(allRawEvents.map((event) => enrichEventFromDetailPage(event)));
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

  // 7.5 Geocode events missing coordinates so they appear on the map
  const geoStats = await geocodeEvents(validEvents);
  console.log(
    `Geocoding: ${geoStats.geocoded} geocoded, ${geoStats.cached} from cache, ${geoStats.failed} failed`
  );

  const fallbackCount = Math.max(0, TARGET_EVENT_COUNT - validEvents.length);
  const mockEvents = fallbackCount > 0 ? generateMockEvents(fallbackCount) : [];
  const finalEvents = [...validEvents, ...mockEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (mockEvents.length > 0) {
    console.log(`Added ${mockEvents.length} mock fallback events to keep the dataset usable`);
  }

  // 8. Write output
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'events.json'), JSON.stringify(finalEvents, null, 2));
  console.log(`\nWrote ${finalEvents.length} events to public/data/events.json`);

  // 9. Write diagnostics
  const elapsed = Date.now() - startTime;
  diagnostics.totalDurationMs = elapsed;
  diagnostics.totalEventsOutput = finalEvents.length;
  diagnostics.totalScrapedEventsOutput = validEvents.length;
  diagnostics.totalMockEventsOutput = mockEvents.length;
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
