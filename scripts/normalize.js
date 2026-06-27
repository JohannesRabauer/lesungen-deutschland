import crypto from 'crypto';

/**
 * German month names for date parsing.
 */
const GERMAN_MONTHS = {
  'januar': 0, 'jan': 0, 'jänner': 0,
  'februar': 1, 'feb': 1,
  'märz': 2, 'mär': 2, 'maerz': 2,
  'april': 3, 'apr': 3,
  'mai': 4,
  'juni': 5, 'jun': 5,
  'juli': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'oktober': 9, 'okt': 9,
  'november': 10, 'nov': 10,
  'dezember': 11, 'dez': 11,
};

/**
 * Parse German date formats into ISO 8601.
 * Handles formats like:
 *  - "15. Januar 2025"
 *  - "15.01.2025"
 *  - "15.01.2025, 19:30 Uhr"
 *  - "Do., 15. Jan. 2025, 19:30"
 *  - "2025-01-15T19:30:00"
 *  - "15. Januar 2025 um 19:30 Uhr"
 */
export function parseGermanDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const trimmed = dateStr.trim();

  // Already ISO 8601
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(trimmed)) {
    // Ensure it has time component
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00.000Z`;
    }
    try {
      return new Date(trimmed).toISOString();
    } catch {
      return trimmed;
    }
  }

  // Extract time if present
  let hours = 0, minutes = 0;
  const timeMatch = trimmed.match(/(\d{1,2})[:\.](\d{2})\s*(?:Uhr|h)?/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2]);
  }

  // Format: "15.01.2025" or "15.1.25"
  const numericMatch = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1]);
    const month = parseInt(numericMatch[2]) - 1;
    let year = parseInt(numericMatch[3]);
    if (year < 100) year += 2000;
    const date = new Date(year, month, day, hours, minutes);
    return date.toISOString();
  }

  // Format: "15. Januar 2025" or "15. Jan 2025" or "15. Jan. 2025"
  const namedMonthMatch = trimmed.match(/(\d{1,2})\.?\s+([A-Za-zäöüÄÖÜ]+)\.?\s+(\d{4})/);
  if (namedMonthMatch) {
    const day = parseInt(namedMonthMatch[1]);
    const monthName = namedMonthMatch[2].toLowerCase();
    const year = parseInt(namedMonthMatch[3]);
    const month = GERMAN_MONTHS[monthName];
    if (month !== undefined) {
      const date = new Date(year, month, day, hours, minutes);
      return date.toISOString();
    }
  }

  // Format: "Januar 15, 2025"
  const monthFirstMatch = trimmed.match(/([A-Za-zäöüÄÖÜ]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthFirstMatch) {
    const monthName = monthFirstMatch[1].toLowerCase();
    const day = parseInt(monthFirstMatch[2]);
    const year = parseInt(monthFirstMatch[3]);
    const month = GERMAN_MONTHS[monthName];
    if (month !== undefined) {
      const date = new Date(year, month, day, hours, minutes);
      return date.toISOString();
    }
  }

  // If we can't parse it, try native Date parsing as last resort
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // Ignore
  }

  return '';
}

/**
 * Known German author names and patterns for extraction.
 */
const LESUNG_PATTERNS = [
  /(?:Lesung|liest|lesen)\s+(?:mit|von)\s+(.+?)(?:\s*[:\-–|]|$)/i,
  /(.+?)\s+(?:liest|lesen|stellt vor|präsentiert)/i,
  /(?:Autorenlesung|Buchvorstellung)[:\s]+(.+?)(?:\s*[:\-–|]|$)/i,
];

const WORK_PATTERNS = [
  /[„""»«](.+?)[""„»«]/,
  /(?:aus|Buch|Roman|Werk)[:\s]+[„""»«]?(.+?)[""„»«]?(?:\s*[–\-|,]|$)/i,
  /(?:stellt vor|präsentiert)[:\s]+[„""»«]?(.+?)[""„»«]?(?:\s*[–\-|,]|$)/i,
];

/**
 * Extract reader/author name from event title and description.
 * Returns { reader, author } where reader is who reads and author is the book's author.
 */
export function extractReaderAndAuthor(title, description = '') {
  const combined = `${title} ${description}`;
  let reader = '';

  // Try patterns to find reader name
  for (const pattern of LESUNG_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      reader = match[1].trim();
      // Clean up common suffixes
      reader = reader.replace(/\s*(aus|liest|präsentiert|stellt vor).*$/i, '').trim();
      break;
    }
  }

  return reader || '';
}

/**
 * Extract book/work title from event title and description.
 */
export function extractWork(title, description = '') {
  const combined = `${title} ${description}`;

  for (const pattern of WORK_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Audience classification keywords.
 */
const AUDIENCE_KEYWORDS = {
  kinder: { group: 'Kinder' },
  jugendliche: { group: 'Jugendliche' },
  familien: { group: 'Familien' },
  senioren: { group: 'Senioren' },
  erwachsene: { group: 'Erwachsene' },
  'bilderbuchkino': { group: 'Kinder', ageRange: 'ab 3' },
  'vorlesestunde': { group: 'Kinder', ageRange: 'ab 4' },
};

const AGE_PATTERNS = [
  /ab\s+(\d+)\s*(?:Jahre|J\.)?/i,
  /(\d+)\s*[-–bis]+\s*(\d+)\s*(?:Jahre|J\.)?/i,
  /(?:für|Alter)[:\s]+(\d+)\s*[-–]\s*(\d+)/i,
  /(?:für|Alter)[:\s]+ab\s+(\d+)/i,
];

/**
 * Classify target audience from event title and description.
 * @returns {{ ageRange?: string, group?: string } | undefined}
 */
export function classifyAudience(title, description = '', audienceHint = '') {
  const combined = `${title} ${description} ${audienceHint}`.toLowerCase();
  const result = {};

  // Check age patterns
  for (const pattern of AGE_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      if (match[2]) {
        result.ageRange = `${match[1]}-${match[2]}`;
      } else {
        result.ageRange = `ab ${match[1]}`;
      }
      break;
    }
  }

  // Check keyword patterns
  for (const [keyword, audience] of Object.entries(AUDIENCE_KEYWORDS)) {
    if (combined.includes(keyword)) {
      if (audience.group) result.group = audience.group;
      if (audience.ageRange && !result.ageRange) result.ageRange = audience.ageRange;
      break;
    }
  }

  // If we found nothing, check if it's obviously for adults
  if (!result.group && !result.ageRange) {
    if (/krimi|thriller|roman|literatur|sachbuch|lyrik|poesie/i.test(combined)) {
      result.group = 'Erwachsene';
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Generate a stable event ID from source + venue + date + title.
 */
export function generateEventId(sourceId, venueName, date, title) {
  const raw = `${sourceId}|${venueName}|${date}|${title}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

/**
 * Normalize a single raw event into the final ReadingEvent schema.
 * @param {object} raw - Raw event from a crawler
 * @returns {object} Normalized event
 */
export function normalizeEvent(raw) {
  const date = parseGermanDate(raw.date);
  const endDate = raw.endDate ? parseGermanDate(raw.endDate) : undefined;

  const title = (raw.title || '').trim();
  const description = (raw.description || '').trim();
  const audienceHint = raw._audienceHint || '';

  // Extract reader and work
  const reader = extractReaderAndAuthor(title, description);
  const work = extractWork(title, description);
  const targetAudience = classifyAudience(title, description, audienceHint);

  // Generate stable ID
  const id = generateEventId(
    raw.sourceId || raw.source || '',
    raw.location?.name || '',
    date,
    title
  );

  // Use reader as author if no explicit author provided
  const author = raw.author || reader || title;

  // NOTE: We intentionally do NOT store the verbatim scraped `description`.
  // Event blurbs can reach the (low) German threshold of originality and
  // republishing them could infringe copyright (sec. 2 UrhG). We keep only
  // factual fields plus a deep link to the source, and derive reader/work/
  // audience from the text without persisting it.
  return {
    id,
    title,
    author,
    date: date || new Date().toISOString(),
    ...(endDate && { endDate }),
    location: {
      name: raw.location?.name || '',
      address: raw.location?.address || '',
      lat: raw.location?.lat || 0,
      lng: raw.location?.lng || 0,
    },
    price: {
      amount: raw.price?.amount || 0,
      currency: raw.price?.currency || 'EUR',
    },
    ...(raw.url && { url: raw.url }),
    source: raw.source || 'unknown',
    ...(reader && { reader }),
    ...(work && { work }),
    ...(targetAudience && { targetAudience }),
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Normalize an array of raw events.
 * @param {Array} rawEvents
 * @returns {Array} Normalized events
 */
export function normalizeEvents(rawEvents) {
  return rawEvents
    .map(normalizeEvent)
    .filter((e) => e.title && e.date);
}

/**
 * Deduplicate events by ID (which is generated from source+venue+date+title).
 * Also checks for URL-based duplicates.
 */
export function deduplicateEvents(events) {
  const seen = new Map();
  const seenUrls = new Set();
  const result = [];

  for (const event of events) {
    // Skip if we've seen this ID
    if (seen.has(event.id)) continue;

    // Skip if we've seen this URL (and it's not a generic page)
    if (event.url && !event.url.includes('veranstaltungen') && !event.url.includes('events')) {
      if (seenUrls.has(event.url)) continue;
      seenUrls.add(event.url);
    }

    seen.set(event.id, true);
    result.push(event);
  }

  return result;
}

/**
 * Validate an event against the schema requirements.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateEvent(event) {
  const errors = [];

  if (!event.id) errors.push('Missing id');
  if (!event.title) errors.push('Missing title');
  if (!event.author) errors.push('Missing author');
  if (!event.date) errors.push('Missing date');
  if (!event.source) errors.push('Missing source');
  if (!event.location) errors.push('Missing location');
  if (event.location && typeof event.location.name !== 'string') errors.push('Invalid location.name');
  if (!event.price) errors.push('Missing price');

  // Validate date format
  if (event.date && isNaN(new Date(event.date).getTime())) {
    errors.push(`Invalid date format: ${event.date}`);
  }

  return { valid: errors.length === 0, errors };
}
