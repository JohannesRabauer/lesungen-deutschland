import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_PATH = path.join(__dirname, 'geocode-cache.json');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Nominatim usage policy: max 1 request per second + identifying User-Agent.
const RATE_LIMIT_MS = 1100;
const USER_AGENT = 'lesungen-deutschland/1.0 (https://github.com/JohannesRabauer/lesungen-deutschland)';

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the list of query strings to try for a location, from most to least specific.
 */
function buildQueries(location) {
  const name = (location?.name || '').trim();
  const address = (location?.address || '').trim();
  const queries = [];
  if (name && address) queries.push(`${name}, ${address}, Deutschland`);
  if (address) queries.push(`${address}, Deutschland`);
  if (name) queries.push(`${name}, Deutschland`);

  // City-level fallbacks: venue names like "Stadtbüchereien Düsseldorf" or
  // "Leipziger Städtische Bibliotheken" aren't known places, but the city is.
  const tokens = name.split(/\s+/).filter((t) => t.length > 3);
  for (const token of [tokens[tokens.length - 1], tokens[0]]) {
    if (!token) continue;
    // Normalize German adjective forms like "Leipziger" -> "Leipzig".
    const city = token.replace(/(er| er)$/u, '');
    if (city.length > 3) queries.push(`${city}, Deutschland`);
  }

  // De-duplicate while preserving order
  return [...new Set(queries)];
}

/**
 * Query Nominatim for a single search string. Returns { lat, lng } or null.
 */
async function queryNominatim(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=de`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Nominatim responded ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Geocode a list of events in place, filling location.lat/lng where missing (0,0).
 * Uses an on-disk cache to avoid repeated lookups and respects Nominatim rate limits.
 *
 * @param {Array} events
 * @returns {Promise<{ geocoded: number, cached: number, failed: number }>}
 */
export async function geocodeEvents(events) {
  const cache = loadCache();
  let geocoded = 0;
  let cached = 0;
  let failed = 0;

  for (const event of events) {
    const loc = event.location || {};
    const hasCoords = (loc.lat && loc.lat !== 0) || (loc.lng && loc.lng !== 0);
    if (hasCoords) continue;

    const queries = buildQueries(loc);
    if (queries.length === 0) {
      failed++;
      continue;
    }

    const cacheKey = queries[0];
    if (cache[cacheKey] !== undefined) {
      const hit = cache[cacheKey];
      if (hit) {
        loc.lat = hit.lat;
        loc.lng = hit.lng;
        cached++;
      } else {
        failed++;
      }
      continue;
    }

    let result = null;
    for (const query of queries) {
      try {
        result = await queryNominatim(query);
      } catch (err) {
        console.warn(`Geocode error for "${query}": ${err.message}`);
        result = null;
      }
      await sleep(RATE_LIMIT_MS);
      if (result) break;
    }

    cache[cacheKey] = result;
    saveCache(cache);

    if (result) {
      loc.lat = result.lat;
      loc.lng = result.lng;
      geocoded++;
      console.log(`Geocoded "${cacheKey}" -> ${result.lat}, ${result.lng}`);
    } else {
      failed++;
      console.warn(`Could not geocode "${cacheKey}"`);
    }
  }

  return { geocoded, cached, failed };
}
