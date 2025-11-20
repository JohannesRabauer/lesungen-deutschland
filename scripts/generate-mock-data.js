import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHORS = [
    "Sebastian Fitzek", "Cornelia Funke", "Marc-Uwe Kling", "Juli Zeh",
    "Ferdinand von Schirach", "Saša Stanišić", "Herta Müller", "Daniel Kehlmann"
];

const CITIES = [
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
    { name: "München", lat: 48.1351, lng: 11.5820 },
    { name: "Köln", lat: 50.9375, lng: 6.9603 },
    { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
    { name: "Leipzig", lat: 51.3397, lng: 12.3731 },
    { name: "Dresden", lat: 51.0504, lng: 13.7373 },
    { name: "Stuttgart", lat: 48.7758, lng: 9.1829 }
];

const LOCATIONS = [
    "Stadtbibliothek", "Thalia Buchhandlung", "Kulturhaus", "Literaturhaus", "Volkshochschule"
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEvents(count) {
    const events = [];
    for (let i = 0; i < count; i++) {
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
        const locationName = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

        // Add some random jitter to coordinates to simulate different venues in the city
        const lat = city.lat + (Math.random() - 0.5) * 0.05;
        const lng = city.lng + (Math.random() - 0.5) * 0.05;

        events.push({
            id: `mock-${i}`,
            title: `Lesung mit ${author}`,
            author: author,
            date: randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).toISOString(),
            location: {
                name: `${locationName} ${city.name}`,
                address: `Musterstraße ${Math.floor(Math.random() * 100)}, ${city.name}`,
                lat: lat,
                lng: lng
            },
            price: {
                amount: Math.floor(Math.random() * 30) + 5,
                currency: "EUR"
            },
            description: `Erleben Sie ${author} live in ${city.name}. Eine spannende Lesung aus dem neuesten Werk.`,
            url: "https://example.com",
            source: "Mock Generator"
        });
    }
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const events = generateEvents(50);
const outputDir = path.join(__dirname, '../public/data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'events.json'), JSON.stringify(events, null, 2));
console.log(`Generated ${events.length} mock events in ${path.join(outputDir, 'events.json')}`);
