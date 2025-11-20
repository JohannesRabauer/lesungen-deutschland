import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting daily scraper job...");

// For now, we just run the mock generator. 
// In the future, this would import and run individual scrapers from ./sources/
try {
    const mockScript = path.join(__dirname, 'generate-mock-data.js');
    execSync(`node "${mockScript}"`, { stdio: 'inherit' });
    console.log("Scraper job completed successfully.");
} catch (error) {
    console.error("Scraper job failed:", error);
    process.exit(1);
}
