import axios from 'axios';

/**
 * Honest, identifiable bot User-Agent.
 *
 * We deliberately use ONE stable, self-identifying User-Agent (with a contact
 * URL) instead of rotating/spoofing real browser strings. Disguising the bot
 * would undermine a good-faith reliance on the German text-and-data-mining
 * exception (sec. 44b UrhG) and could look like circumventing access controls.
 */
export const BOT_PRODUCT_TOKEN = 'LesungenDeutschlandBot';
export const BOT_USER_AGENT =
  'LesungenDeutschlandBot/1.0 (+https://github.com/JohannesRabauer/lesungen-deutschland)';

/**
 * Per-host cache of parsed robots.txt rules.
 * Map<host, { groups, crawlDelay } | null>  (null = fetch failed / no robots)
 */
const robotsCache = new Map();

/**
 * Parse robots.txt content into groups of rules.
 * Each group: { agents: string[], rules: [{ allow: boolean, path: string }], crawlDelay?: number }
 */
function parseRobotsTxt(content) {
  const groups = [];
  let current = null;
  let lastLineWasAgent = false;

  const lines = content.split(/\r?\n/);
  for (let raw of lines) {
    // Strip comments and trim
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;

    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      // Consecutive User-agent lines share the same following rule block.
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [], crawlDelay: undefined };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }

    lastLineWasAgent = false;
    if (!current) continue;

    if (field === 'disallow') {
      current.rules.push({ allow: false, path: value });
    } else if (field === 'allow') {
      current.rules.push({ allow: true, path: value });
    } else if (field === 'crawl-delay') {
      const n = parseFloat(value.replace(',', '.'));
      if (!isNaN(n)) current.crawlDelay = n;
    }
  }

  return groups;
}

/**
 * Select the most specific group that applies to our bot:
 * an exact/product-token match wins over the wildcard '*' group.
 */
function selectGroup(groups) {
  const token = BOT_PRODUCT_TOKEN.toLowerCase();
  let wildcard = null;
  let specific = null;

  for (const group of groups) {
    for (const agent of group.agents) {
      if (agent === '*') {
        wildcard = wildcard || group;
      } else if (token.includes(agent) || agent.includes(token)) {
        specific = specific || group;
      }
    }
  }

  return specific || wildcard || null;
}

/**
 * Does a robots.txt path pattern match the URL path?
 * Supports '*' wildcards and '$' end-anchor per the robots.txt spec.
 */
function pathMatches(pattern, urlPath) {
  if (pattern === '') return false; // empty Disallow means "allow all"
  // Build a regex from the pattern.
  let regex = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      regex += '.*';
    } else if (ch === '$' && i === pattern.length - 1) {
      regex += '$';
    } else {
      regex += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  try {
    return new RegExp('^' + regex).test(urlPath);
  } catch {
    return urlPath.startsWith(pattern.replace(/[*$]/g, ''));
  }
}

/**
 * Fetch + cache robots.txt for the host of a URL.
 */
async function getRobots(url) {
  let host;
  try {
    host = new URL(url).origin;
  } catch {
    return null;
  }

  if (robotsCache.has(host)) return robotsCache.get(host);

  let parsed = null;
  try {
    const res = await axios.get(`${host}/robots.txt`, {
      timeout: 10000,
      headers: { 'User-Agent': BOT_USER_AGENT },
      maxRedirects: 5,
      // Treat 4xx as "no robots.txt" rather than throwing.
      validateStatus: (s) => s < 500,
    });

    if (res.status >= 200 && res.status < 300 && typeof res.data === 'string') {
      const groups = parseRobotsTxt(res.data);
      parsed = { group: selectGroup(groups) };
    } else {
      // No robots.txt (404 etc.) => everything allowed.
      parsed = { group: null };
    }
  } catch {
    // Network/parse error: be conservative but don't hard-block; treat as allowed.
    parsed = { group: null };
  }

  robotsCache.set(host, parsed);
  return parsed;
}

/**
 * Returns true if our bot is allowed to fetch the given URL per robots.txt.
 * Uses longest-match precedence between Allow and Disallow rules.
 */
export async function isAllowed(url) {
  const robots = await getRobots(url);
  if (!robots || !robots.group) return true;

  let urlPath;
  try {
    const u = new URL(url);
    urlPath = u.pathname + u.search;
  } catch {
    return true;
  }

  let decision = true; // default allow
  let matchLength = -1;

  for (const rule of robots.group.rules) {
    if (pathMatches(rule.path, urlPath)) {
      const len = rule.path.length;
      // Longest match wins; Allow beats Disallow on equal length.
      if (len > matchLength || (len === matchLength && rule.allow)) {
        matchLength = len;
        decision = rule.allow;
      }
    }
  }

  return decision;
}

/**
 * Crawl-delay (seconds) declared for our bot, or undefined.
 */
export async function getCrawlDelay(url) {
  const robots = await getRobots(url);
  return robots?.group?.crawlDelay;
}
