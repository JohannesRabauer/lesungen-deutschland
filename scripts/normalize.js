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

const HTML_ENTITY_MAP = {
  amp: '&',
  apos: '\'',
  bdquo: '„',
  hellip: '…',
  laquo: '«',
  ldquo: '“',
  lsquo: '‘',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  raquo: '»',
  rdquo: '”',
  rsquo: '’',
};

const GENERIC_TITLE_PATTERNS = [
  /^aktuelle veranstaltungen$/i,
  /^veranstaltungen$/i,
  /^veranstaltungskalender$/i,
  /^programm$/i,
  /^termine$/i,
  /^kalender$/i,
];

const NAME_CONNECTORS = new Set([
  'de', 'del', 'den', 'der', 'di', 'du', 'la', 'le', 'van', 'von', 'zu', 'zum', 'zur',
]);

const TITLE_PREFIX_RE = /^(?:(?:literatur|lesart)\s*[:!]\s*)+/i;

function decodeHtmlEntities(value = '') {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    const lower = entity.toLowerCase();

    if (lower.startsWith('#x')) {
      const codePoint = parseInt(lower.slice(2), 16);
      return Number.isNaN(codePoint) ? _ : String.fromCodePoint(codePoint);
    }

    if (lower.startsWith('#')) {
      const codePoint = parseInt(lower.slice(1), 10);
      return Number.isNaN(codePoint) ? _ : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[lower] ?? _;
  });
}

function cleanText(value = '') {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLeadingDate(text = '') {
  return cleanText(text)
    .replace(
      /^(?:[A-Za-zÄÖÜäöü]{2,4}\.?,?\s+)?\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4})(?:\s*[-–:]\s*|\s+)/,
      ''
    )
    .trim();
}

function normalizeTitle(title = '') {
  return stripLeadingDate(title).replace(TITLE_PREFIX_RE, '').trim();
}

function looksLikeGenericTitle(title = '') {
  const normalized = normalizeTitle(title).toLowerCase();
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isCapitalizedWord(word) {
  if (!word) return false;
  if (NAME_CONNECTORS.has(word.toLowerCase())) return true;
  return /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'’-]+$/.test(word);
}

function looksLikePersonName(candidate = '') {
  const cleaned = cleanText(candidate).replace(/[,:;.]$/, '');
  if (!cleaned || /\d/.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;

  return words.every(isCapitalizedWord);
}

function splitPotentialNames(segment = '') {
  const normalized = cleanText(segment)
    .replace(/\s+(?:und|&)\s+/gi, ', ')
    .replace(/\s*\/\s*/g, ', ');

  return normalized
    .split(/\s*,\s*/)
    .map((value) => value.replace(/\([^)]*\)/g, '').trim())
    .filter(looksLikePersonName);
}

function looksLikePersonList(candidate = '') {
  const names = splitPotentialNames(candidate);
  return names.length > 0 && names.join(', ') === cleanText(candidate).replace(/\s+(?:und|&)\s+/gi, ', ');
}

function extractNamesFromDescription(description = '') {
  const cleaned = cleanText(description);

  const podiumNames = Array.from(
    cleaned.matchAll(
      /(?:^|[-–•])\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'’-]+(?:\s+(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'’-]+|van|von|de|del|den|der|zu|zum|zur)){1,4})\s*:/g
    ),
    (match) => match[1]
  ).filter(looksLikePersonName);

  if (podiumNames.length > 0) {
    return [...new Set(podiumNames)].join(', ');
  }

  const labeledMatch = cleaned.match(
    /(?:Lesung|Buchpremiere|Buchvorstellung|Ein Abend|Gespräch|Diskussion|Moderation)\s+(?:mit|von)\s+(.+?)(?:\s*[.!?:]|$)/i
  );
  if (labeledMatch) {
    const names = splitPotentialNames(labeledMatch[1]);
    if (names.length > 0) return names.join(', ');
  }

  return '';
}

function extractTitleAuthorAndWork(title = '') {
  const cleaned = normalizeTitle(title);

  const dashMatch = cleaned.match(
    /^([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'’-]+(?:\s+(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'’-]+|van|von|de|del|den|der|zu|zum|zur)){1,4})\s+[–-]\s+(.+)$/
  );
  if (dashMatch && looksLikePersonName(dashMatch[1])) {
    return {
      author: dashMatch[1].trim(),
      reader: dashMatch[1].trim(),
      work: cleanText(dashMatch[2]),
    };
  }

  const withMatch = cleaned.match(
    /(?:Lesung|Buchpremiere|Buchvorstellung|Ein Abend|Gespräch|Diskussion)\s+(?:mit|von)\s+(.+?)(?:\s*[:\-–|]|$)/i
  );
  if (withMatch) {
    const names = splitPotentialNames(withMatch[1]);
    if (names.length > 0) {
      return { author: names.join(', '), reader: names.join(', ') };
    }
  }

  const bareMitMatch = cleaned.match(/\bmit\s+(.+?)(?:\s*[:\-–|]|$)/i);
  if (bareMitMatch) {
    const names = splitPotentialNames(
      bareMitMatch[1].replace(/\s+(?:in|im|bei|am|auf)\b.+$/i, '')
    );
    if (names.length > 0) {
      return { author: names.join(', '), reader: names.join(', ') };
    }
  }

  return {};
}

/**
 * Parse German date formats into ISO 8601.
 * Handles formats like:
 *  - "15. Januar 2025"
 *  - "15.01.2025"
 *  - "15.01.2025, 19:30 Uhr"
 *  - "Do., 15. Jan. 2025, 19:30"
 *  - "2025-01-15T19:30:00"
 *  - "15. Januar 2025 um 19:30 Uhr"
 *  - "2025-01-15 19:30:00"
 *  - "29. Juni 2026 um 17 Uhr"
 */
export function parseGermanDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const trimmed = cleanText(dateStr)
    .replace(/^(?:Mo|Di|Mi|Do|Fr|Sa|So)\.?,?\s+/i, '')
    .replace(/\s+um\s+/i, ' ')
    .trim();

  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    return new Date(trimmed.replace(' ', 'T')).toISOString();
  }

  // Already ISO 8601
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(trimmed)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00.000Z`;
    }
    try {
      return new Date(trimmed).toISOString();
    } catch {
      return '';
    }
  }

  // Extract time if present
  let hours = 0;
  let minutes = 0;
  const timeMatch = trimmed.match(/(\d{1,2})(?:[:\.](\d{2}))?\s*(?:Uhr|h)\b/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  }

  // Format: "15.01.2025" or "15.1.25"
  const numericMatch = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10) - 1;
    let year = parseInt(numericMatch[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(year, month, day, hours, minutes);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  // Format: "15. Januar 2025" or "15. Jan 2025" or "15. Jan. 2025"
  const namedMonthMatch = trimmed.match(/(\d{1,2})\.?\s+([A-Za-zäöüÄÖÜ]+)\.?\s+(\d{4})/);
  if (namedMonthMatch) {
    const day = parseInt(namedMonthMatch[1], 10);
    const monthName = namedMonthMatch[2].toLowerCase();
    const year = parseInt(namedMonthMatch[3], 10);
    const month = GERMAN_MONTHS[monthName];
    if (month !== undefined) {
      const date = new Date(year, month, day, hours, minutes);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }
  }

  try {
    const nativeDate = new Date(trimmed);
    if (!Number.isNaN(nativeDate.getTime())) {
      return nativeDate.toISOString();
    }
  } catch {
    // Ignore
  }

  return '';
}

function extractExplicitDate(text = '') {
  const cleaned = cleanText(text);
  if (!cleaned) return '';

  const candidates = [
    /\b(?:am|wann)[:\s]+(\d{1,2}\.\d{1,2}\.\d{2,4}(?:\s*(?:um)?\s*\d{1,2}(?:[:\.]\d{2})?\s*(?:Uhr|h)?)?)/i,
    /\b(?:am|wann)[:\s]+(\d{1,2}\.\s*[A-Za-zÄÖÜäöü]+\.?\s+\d{4}(?:\s*(?:um)?\s*\d{1,2}(?:[:\.]\d{2})?\s*(?:Uhr|h)?)?)/i,
    /(?:^|[.:\s])(\d{1,2}\.\d{1,2}\.\d{2,4}(?:\s*(?:um)?\s*\d{1,2}(?:[:\.]\d{2})?\s*(?:Uhr|h)?)?)/i,
    /(?:^|[.:\s])(\d{1,2}\.\s*[A-Za-zÄÖÜäöü]+\.?\s+\d{4}(?:\s*(?:um)?\s*\d{1,2}(?:[:\.]\d{2})?\s*(?:Uhr|h)?)?)/i,
  ];

  for (const pattern of candidates) {
    const match = cleaned.match(pattern);
    if (match) {
      const parsed = parseGermanDate(match[1]);
      if (parsed) return parsed;
    }
  }

  return '';
}

function isSameCalendarDay(a, b) {
  if (!a || !b) return false;
  const aDate = new Date(a);
  const bDate = new Date(b);

  return (
    aDate.getUTCFullYear() === bDate.getUTCFullYear() &&
    aDate.getUTCMonth() === bDate.getUTCMonth() &&
    aDate.getUTCDate() === bDate.getUTCDate()
  );
}

function resolveEventDate(raw) {
  const rawDate = parseGermanDate(raw.date || '');
  const titleDate = extractExplicitDate(raw.title || '');
  const descriptionDate = extractExplicitDate(raw.description || '');

  if (descriptionDate) {
    if (!rawDate) return descriptionDate;
    if (titleDate && isSameCalendarDay(rawDate, titleDate) && !isSameCalendarDay(rawDate, descriptionDate)) {
      return descriptionDate;
    }
  }

  return rawDate || titleDate || '';
}

const WORK_PATTERNS = [
  /[„"»«](.+?)["“”„»«]/,
  /(?:stellt vor|präsentiert)[:\s]+[„"»«]?(.+?)["“”„»«]?(?:\s*[–\-|,]|$)/i,
  /(?:sein|ihr)\s+(?:neues?\s+)?(?:buch|roman|werk)[:\s]+[„"»«]?(.+?)["“”„»«]?(?:\s*[–\-|,]|$)/i,
];

function extractWork(title, description = '') {
  const titleDetails = extractTitleAuthorAndWork(title);
  if (titleDetails.work) return titleDetails.work;

  const combined = `${normalizeTitle(title)} ${cleanText(description)}`;
  for (const pattern of WORK_PATTERNS) {
    const match = combined.match(pattern);
    if (match) return cleanText(match[1]);
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
};

const AGE_PATTERNS = [
  /ab\s+(\d+)\s*(?:jahre|j\.)/i,
  /(?:für|alter)[:\s]+(\d+)\s*[-–bis]+\s*(\d+)\s*(?:jahre|j\.)/i,
  /(?:für|alter)[:\s]+ab\s+(\d+)\s*(?:jahre|j\.)?/i,
];

/**
 * Classify target audience from event title and description.
 * @returns {{ ageRange?: string, group?: string } | undefined}
 */
export function classifyAudience(title, description = '', audienceHint = '') {
  const combined = cleanText(`${title} ${description} ${audienceHint}`).toLowerCase();
  const keywordText = cleanText(`${title} ${audienceHint}`).toLowerCase();
  const result = {};

  for (const pattern of AGE_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      result.ageRange = match[2] ? `${match[1]}-${match[2]}` : `ab ${match[1]}`;
      break;
    }
  }

  for (const [keyword, audience] of Object.entries(AUDIENCE_KEYWORDS)) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(keywordText)) {
      if (audience.group) result.group = audience.group;
      break;
    }
  }

  if (!result.group && !result.ageRange) {
    if (/\b(krimi|thriller|roman|literatur|sachbuch|lyrik|poesie)\b/i.test(combined)) {
      result.group = 'Erwachsene';
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function extractPeople(title, description = '') {
  const titleDetails = extractTitleAuthorAndWork(title);
  const descriptionNames = extractNamesFromDescription(description);

  const author = titleDetails.author || descriptionNames || '';
  const reader = titleDetails.reader || author || '';

  return {
    author,
    reader,
  };
}

/**
 * Generate a stable event ID from source + venue + date + title.
 */
export function generateEventId(sourceId, venueName, date, title) {
  const raw = `${sourceId}|${venueName}|${date}|${title}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

function hasMeaningfulMetadata(event) {
  if (looksLikeGenericTitle(event.title)) return false;

  if (event.reader && looksLikePersonList(event.reader)) {
    return true;
  }

  return event.author && event.author !== event.title && looksLikePersonList(event.author);
}

/**
 * Normalize a single raw event into the final ReadingEvent schema.
 * @param {object} raw - Raw event from a crawler
 * @returns {object} Normalized event
 */
export function normalizeEvent(raw) {
  const title = normalizeTitle(raw.title || '');
  const description = cleanText(raw.description || '');
  const audienceHint = cleanText(raw._audienceHint || '');
  const date = resolveEventDate({ title: raw.title || '', description, date: raw.date || '' });
  const endDate = raw.endDate ? parseGermanDate(raw.endDate) : undefined;
  const { author: extractedAuthor, reader } = extractPeople(title, description);
  const work = extractWork(title, description);
  const targetAudience = classifyAudience(title, description, audienceHint);

  const author = cleanText(raw.author || extractedAuthor || reader || title);
  const locationName = cleanText(raw.location?.name || '');
  const locationAddress = cleanText(raw.location?.address || '');
  const sourceName = cleanText(raw.source || 'unknown');

  const id = generateEventId(
    raw.sourceId || sourceName,
    locationName,
    date,
    title
  );

  return {
    id,
    title,
    author,
    date,
    ...(endDate && { endDate }),
    location: {
      name: locationName,
      address: locationAddress,
      lat: raw.location?.lat || 0,
      lng: raw.location?.lng || 0,
    },
    price: {
      amount: raw.price?.amount || 0,
      currency: cleanText(raw.price?.currency || 'EUR'),
    },
    ...(raw.url && { url: raw.url }),
    source: sourceName,
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
    .filter((event) => event.title && event.date && hasMeaningfulMetadata(event));
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
    if (seen.has(event.id)) continue;

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
  if (looksLikeGenericTitle(event.title)) errors.push('Generic title');
  if (!event.author) errors.push('Missing author');
  if (!event.date) errors.push('Missing date');
  if (!event.source) errors.push('Missing source');
  if (!event.location) errors.push('Missing location');
  if (event.location && typeof event.location.name !== 'string') errors.push('Invalid location.name');
  if (!event.price) errors.push('Missing price');
  if (!hasMeaningfulMetadata(event)) errors.push('Missing identifiable participants or work');

  if (event.date && Number.isNaN(new Date(event.date).getTime())) {
    errors.push(`Invalid date format: ${event.date}`);
  }

  return { valid: errors.length === 0, errors };
}
