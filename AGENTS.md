# AGENTS.md

This repository is a static React application plus a small Node-based event data pipeline. Use this guide to make safe, repo-specific changes.

## What this repo does

- renders a Germany-wide literary event discovery UI
- loads event data from `public/data/events.json`
- supports list view, map view, free-text search, and geolocation-based map centering
- refreshes data through a mock generator and a Thalia Puppeteer scraper
- deploys the static app to GitHub Pages

## Repository map

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Main page logic, list/map toggle, search, geolocation |
| `src/hooks/useEvents.ts` | Fetches `/data/events.json`, exposes loading/error state |
| `src/components/MapComponent.tsx` | Leaflet map, markers, popups, icon setup |
| `src/components/Header.tsx` | Top navigation shell with placeholder links |
| `src/types/index.ts` | `ReadingEvent` and filter type definitions |
| `public/data/events.json` | Runtime dataset consumed directly by the frontend |
| `scripts/generate-mock-data.js` | Generates 50 mock events in frontend shape |
| `scripts/scrape.js` | Orchestrates data refresh and writes merged dataset |
| `scripts/sources/thalia.js` | Puppeteer scraper for Thalia event listings |
| `.github/workflows/deploy.yml` | Build and GitHub Pages deployment workflow |
| `.github/workflows/update-data.yml` | Daily data refresh and commit workflow |

## Core data contract

The frontend expects every event to match `ReadingEvent` in `src/types/index.ts`:

- `id`
- `title`
- `author`
- `date` as ISO 8601
- `location.name`
- `location.address`
- `location.lat`
- `location.lng`
- `price.amount`
- `price.currency`
- optional `url`
- `source`

Note: we intentionally do **not** store a verbatim scraped `description`. Event
blurbs can be copyrightable, so the pipeline keeps only factual fields plus a
deep link to the source. Reader/work/audience are derived from the source text
but the text itself is not persisted.

If you change this shape, update:

1. `src/types/index.ts`
2. any frontend consumers in `src/`
3. data generation/scraping scripts
4. checked-in docs describing the model and workflows

## How the frontend consumes data

- `useEvents` fetches `/data/events.json` on mount and stores the parsed array in local state.
- `App.tsx` filters the loaded events with a case-insensitive search across author, location name, and address.
- The list view and map view both depend on the same filtered event array.
- The "In meiner Nähe" action only changes map centering today; it does not sort by distance or filter by radius.

When changing the UI, preserve parity between list and map behavior unless the change is intentionally view-specific.

## Crawling policy (legal hygiene)

The scraper is built to be a polite, good-faith crawler under German/EU law:

- **robots.txt is respected** via `scripts/robots.js` (`isAllowed`, `getCrawlDelay`).
  Disallowed URLs are skipped, not fetched.
- **One honest User-Agent** (`LesungenDeutschlandBot/1.0 (+repo)`) is used
  everywhere — no rotating or spoofed browser User-Agents.
- **Low volume:** modest concurrency, a raised rate limit, and a per-source
  event cap (`MAX_EVENTS_PER_SOURCE` in `scripts/scrape.js`) to avoid systematic
  database extraction.
- **No verbatim text:** only factual fields plus a deep link are stored.

The app ships an Impressum (`/impressum`) and Datenschutzerklärung
(`/datenschutz`); operator contact details in those pages are placeholders that
must be completed before going live.

## How scraping and refresh work

- `node scripts/generate-mock-data.js` overwrites `public/data/events.json` with 50 generated events.
- `node scripts/scrape.js` reruns the mock generator, reads that output back in, appends Thalia results, and rewrites `public/data/events.json`.
- `scripts/sources/thalia.js` currently parses source HTML with broad selectors and assigns approximate coordinates with random jitter.
- `update-data.yml` is the scheduled operational entry point for refreshing data in GitHub.

If you add a new source:

1. keep the output aligned to `ReadingEvent`
2. wire it into `scripts/scrape.js`
3. document the source and any operational caveats
4. validate the generated JSON still works in the frontend

## Commands to use

Install dependencies first if needed:

```bash
npm ci --legacy-peer-deps
```

Primary repo commands:

```bash
npm run lint
npm run build
npm run dev
npm run preview
```

Pipeline commands:

```bash
node scripts/generate-mock-data.js
node scripts/scrape.js
```

## Workflow conventions

- Keep changes surgical and repo-specific.
- Prefer updating existing files over introducing new abstractions unless reuse is clear.
- Use the existing static JSON workflow; do not introduce a backend unless explicitly requested.
- Preserve German-facing UI copy unless the task is specifically about copy changes.
- When changing scraper behavior, keep failures visible; do not silently hide data issues.

## High-risk areas

### `public/data/events.json`

This file is checked in, consumed directly by the app, and updated by automation. Invalid JSON or shape drift breaks the runtime.

### `scripts/sources/thalia.js`

This scraper is brittle by nature:

- selectors may break when Thalia changes markup
- cookie-banner handling is only a best-effort guess
- coordinates are not real venue coordinates
- `author` is currently inferred from the scraped title

### `src/components/MapComponent.tsx`

Leaflet asset handling and icon setup can fail easily during refactors. Preserve marker rendering and the existing icon workaround unless you replace it deliberately.

### `src/components/Header.tsx`

The nav links are placeholders today. Do not imply routed behavior in docs or code unless you actually add routing.

## Documentation update rules

Update the repo docs in the same change when you alter:

- architecture or top-level flows
- the `ReadingEvent` data model
- scraper sources or refresh behavior
- deployment or GitHub Actions workflows
- user-visible capabilities or limitations

At minimum, review these files after such changes:

- `README.md`
- `AGENTS.md`
- `docs/specification.md`
- any affected skill under `.github/skills/`

## Current known limitations

- approximate coordinates for scraped Thalia events
- mixed mock and scraped dataset
- placeholder header navigation links
- no automated tests beyond lint/build
- no backend or admin tooling
