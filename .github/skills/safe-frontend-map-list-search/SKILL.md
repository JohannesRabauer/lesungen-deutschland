# Safe frontend changes for map, list, and search

Use this skill when changing the user-facing event discovery UI without breaking the current static-data flow.

## Invoke when

- the request touches list cards, search, map markers, or geolocation
- the user wants a new event filter or sorting behavior
- you need to refactor the frontend while preserving the current data contract

## Required context

- `src/App.tsx`
- `src/hooks/useEvents.ts`
- `src/components/MapComponent.tsx`
- `src/components/Header.tsx`
- `src/types/index.ts`
- `public/data/events.json`

## Workflow

1. Start from `src/types/index.ts` and confirm the event fields available to the UI.
2. Trace how `useEvents` loads data and how `App.tsx` derives filtered state for both list and map views.
3. Preserve loading and error behavior when restructuring the UI.
4. Keep search behavior consistent across list and map views unless the task explicitly introduces divergence.
5. Treat geolocation as a progressive enhancement: failure paths should remain clear and the app should still work without location access.
6. Preserve or intentionally replace the Leaflet marker icon setup in `MapComponent.tsx`.
7. If a UI change alters capabilities, update the repo docs and specification.

## Validation

```bash
npm run lint
npm run build
```

## Repo-specific cautions

- Header links are placeholders today; do not assume routing exists.
- The frontend fetches one static file from `/data/events.json`; there is no API fallback.
- Search currently matches author, location name, and address only.
