import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scrapeThalia } from './sources/thalia.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting daily scraper job...");

async function run() {
    const outputDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let allEvents = [];

    // 1. Run Mock Generator (optional, maybe we want to keep it for now)
    // We can read the existing events.json if we want to append, or just overwrite.
    // Let's run the mock generator to get base data
    try {
        const mockScript = path.join(__dirname, 'generate-mock-data.js');
        execSync(`node "${mockScript}"`, { stdio: 'inherit' });

        const mockDataPath = path.join(outputDir, 'events.json');
        if (fs.existsSync(mockDataPath)) {
            const mockEvents = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
            allEvents = [...mockEvents];
        }
    } catch (e) {
        console.error("Failed to run mock generator", e);
    }

    // 2. Run Thalia Scraper
    try {
        const thaliaEvents = await scrapeThalia();
        allEvents = [...allEvents, ...thaliaEvents];
    } catch (e) {
        console.error("Failed to scrape Thalia", e);
    }

    // 3. Save combined data
    fs.writeFileSync(path.join(outputDir, 'events.json'), JSON.stringify(allEvents, null, 2));
    console.log(`Total events saved: ${allEvents.length}`);
}

run();


