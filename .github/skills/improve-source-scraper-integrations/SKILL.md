# Improve source scraper integrations

Use this skill when extending or hardening the repository's source ingestion layer.

## Invoke when

- adding a new event source
- improving Thalia extraction quality
- replacing approximate coordinates with better location handling
- debugging scraper-only failures without changing the frontend

## Required context

- `scripts/sources/thalia.js`
- `scripts/scrape.js`
- `src/types/index.ts`
- `public/data/events.json`
- `.github/workflows/update-data.yml`

## Workflow

1. Keep each source adapter responsible for returning `ReadingEvent`-compatible objects.
2. Normalize IDs, date parsing, URLs, pricing, and source names before data reaches `public/data/events.json`.
3. Prefer source-specific parsing fixes inside the relevant `scripts/sources/*.js` file rather than adding frontend workarounds.
4. If you add a new source, wire it into `scripts/scrape.js` and document how it participates in the merged dataset.
5. Make operational caveats explicit: selector fragility, missing venue coordinates, inferred author names, or partial-source failure behavior.
6. Rebuild the dataset and verify the frontend can still build against the output.

## Validation

```bash
node scripts/scrape.js
npm run build
```

## Repo-specific cautions

- The current Thalia scraper uses broad DOM traversal around `h4` headings and can break quietly when markup shifts.
- `author` is currently derived from the scraped title, so source quality improvements may require better parsing.
- `scripts/scrape.js` merges sources into one static JSON file, so a malformed source can affect the whole app.
