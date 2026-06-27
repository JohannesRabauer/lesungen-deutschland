# Refresh event data pipeline

Use this skill when you need to refresh, diagnose, or explain the repository's event-data pipeline.

## Invoke when

- the user asks to update `public/data/events.json`
- the daily data workflow failed or produced stale data
- Thalia events disappeared or look malformed
- you need to explain where event data comes from

## Required context

- `scripts/scrape.js`
- `scripts/generate-mock-data.js`
- `scripts/sources/thalia.js`
- `public/data/events.json`
- `.github/workflows/update-data.yml`
- `src/types/index.ts`

## Workflow

1. Inspect the current dataset shape in `public/data/events.json` and confirm it still matches `ReadingEvent`.
2. Run `node scripts/scrape.js` to rebuild the dataset using the current pipeline.
3. If scraper output is unexpectedly empty, inspect `scripts/sources/thalia.js` first for selector or cookie-banner drift.
4. Keep the merged-data contract intact: mock events may seed the file, then scraper output is appended.
5. If you change fields or source mapping, update the frontend consumers and documentation in the same change.
6. Check `.github/workflows/update-data.yml` if the problem appears only in automation.

## Validation

```bash
node scripts/scrape.js
npm run build
```

## Repo-specific cautions

- Thalia coordinates are approximate, not geocoded.
- The checked-in dataset may vary depending on scraper yield.
- `scripts/scrape.js` currently tolerates source failures and still writes output, so inspect logs carefully when results look suspicious.
