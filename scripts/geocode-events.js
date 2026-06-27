import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { geocodeEvents } from './geocode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standalone runner: geocode the events already written to public/data/events.json.
 * Useful for backfilling coordinates without re-running the full scrape pipeline.
 */
async function run() {
  const eventsPath = path.join(__dirname, '..', 'public', 'data', 'events.json');
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
  console.log(`Loaded ${events.length} events from ${eventsPath}`);

  const stats = await geocodeEvents(events);
  console.log(
    `Geocoding: ${stats.geocoded} geocoded, ${stats.cached} from cache, ${stats.failed} failed`
  );

  fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));
  const withCoords = events.filter(
    (e) => (e.location?.lat && e.location.lat !== 0) || (e.location?.lng && e.location.lng !== 0)
  ).length;
  console.log(`Wrote ${events.length} events (${withCoords} with coordinates).`);
}

run().catch((error) => {
  console.error('Geocoding failed:', error);
  process.exit(1);
});
