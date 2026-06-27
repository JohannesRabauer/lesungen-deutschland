/**
 * Reusable "is this event a Lesung?" classifier.
 *
 * German libraries (Stadtbibliotheken, Landesbibliotheken) publish very mixed
 * event programmes: author readings ("Lesungen") sit next to workshops,
 * Bibliotheksführungen, Flohmärkte, Gaming-Nachmittage, Sprechstunden and so
 * on. When we crawl a library's full event listing we only want to keep the
 * readings.
 *
 * This module is crawler-agnostic: it works on the plain title / description /
 * audience-hint strings produced by every crawler, so any source (library,
 * bookshop, Literaturhaus) can reuse it.
 */

/**
 * Strong signals: if any of these appears, the event is almost certainly a
 * reading, regardless of other words present.
 */
export const STRONG_LESUNG_PATTERNS = [
  /\blesung(en)?\b/i,
  /\bliest\b/i,
  /\bliest\s+aus\b/i,
  /\blas\s+aus\b/i,
  /autoren?lesung/i,
  /dichterlesung/i,
  /krimilesung/i,
  /buchvorstellung/i,
  /buchpr(ä|ae)sentation/i,
  /buchpremiere/i,
  /buchpremieren/i,
  /lese(abend|nacht|fest|reihe|b(ü|ue)hne)/i,
  /literarische[rs]?\s+(abend|salon|soir(é|e)e)/i,
];

/**
 * Soft signals: typical for readings (often children's reading formats or
 * literary events) but ambiguous enough that an unrelated negative keyword can
 * override them.
 */
export const SOFT_LESUNG_PATTERNS = [
  /\bvorles/i, // Vorlesen, Vorlesestunde, Vorlesepate
  /bilderbuchkino/i,
  /m(ä|ae)rchen(stunde|erz(ä|ae)hl)/i,
  /geschichten(zeit|stunde|zeit)/i,
  /erz(ä|ae)hl(café|cafe|stunde|zeit)/i,
  /poetry\s*slam/i,
  /\blyrik\b/i,
  /\bgedichte\b/i,
  /stellt\s+.+\s+vor/i,
  /pr(ä|ae)sentiert\s+(sein|ihr|das|den|die)\s+(neue[ns]?\s+)?(buch|roman|werk)/i,
  /literatur(abend|nacht|salon)/i,
];

/**
 * Hard negatives: clearly non-reading library events. These override SOFT
 * matches (but not STRONG ones, e.g. an explicit "Krimilesung im Rahmen der
 * Ausstellung" should stay a reading).
 */
export const NON_LESUNG_PATTERNS = [
  /(bibliotheks?)?f(ü|ue)hrung/i,
  /workshop/i,
  /sprechstunde/i,
  /(b(ü|ue)cher)?flohmarkt/i,
  /tr(ö|oe)del/i,
  /kleidertausch/i,
  /repair[\s-]?caf/i,
  /\bgaming\b/i,
  /spielenach(mittag|t)/i,
  /brettspiel/i,
  /(computer|smartphone|tablet|laptop|internet)[\s-]?(kurs|sprechstunde|hilfe|schulung)/i,
  /sprach(café|cafe|treff)/i,
  /bewerbungs/i,
  /\bvortrag\b/i,
  /ausstellungser(ö|oe)ffnung/i,
  /\bausstellung\b/i,
  /\bkonzert\b/i,
  /\byoga\b/i,
  /(strick|n(ä|ae)h|h(ä|ae)kel)(treff|cafe|café|kurs)/i,
  /einf(ü|ue)hrung\s+in\s+die\s+(bibliotheks?|recherche|datenbank)/i,
  /recherche(kurs|schulung|training)/i,
];

/**
 * Test a set of regex patterns against a string.
 */
function anyMatch(patterns, text) {
  return patterns.some((re) => re.test(text));
}

/**
 * Decide whether an event looks like an author reading (Lesung).
 *
 * @param {string} title - Event title
 * @param {string} [description] - Event description / teaser text
 * @param {string} [hint] - Extra hint text (e.g. audience/category labels)
 * @returns {boolean}
 */
export function isLesung(title = '', description = '', hint = '') {
  const text = `${title} ${description} ${hint}`.toLowerCase();
  if (!text.trim()) return false;

  // Strong signals always win.
  if (anyMatch(STRONG_LESUNG_PATTERNS, text)) return true;

  // Soft signals count only when no hard-negative is present.
  if (anyMatch(SOFT_LESUNG_PATTERNS, text) && !anyMatch(NON_LESUNG_PATTERNS, text)) {
    return true;
  }

  return false;
}

/**
 * Filter a list of raw crawler events down to readings.
 * Uses the raw (pre-normalization) description, which is still available at
 * this stage and gives the classifier much more signal than the title alone.
 *
 * @param {Array<object>} rawEvents
 * @returns {Array<object>} only events that look like readings
 */
export function filterLesungen(rawEvents) {
  if (!Array.isArray(rawEvents)) return [];
  return rawEvents.filter((e) =>
    isLesung(e?.title || '', e?.description || '', e?._audienceHint || '')
  );
}
