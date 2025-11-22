import puppeteer from 'puppeteer';

export async function scrapeThalia() {
    console.log("Scraping Thalia with Puppeteer...");
    const url = 'https://www.thalia.de/veranstaltung/veranstaltungskalender';

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a real user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Handle cookie banner if present (optional, but good practice)
        try {
            const cookieButton = await page.$('button[id*="usercentrics-root"]'); // Generic guess, might need specific selector
            if (cookieButton) await cookieButton.click();
        } catch (e) {
            // Ignore if no cookie banner
        }

        // Extract data
        const events = await page.evaluate(() => {
            const eventsList = [];
            const h4s = document.querySelectorAll('h4');

            h4s.forEach((h4, i) => {
                let current = h4.nextElementSibling;
                let title = '';
                let dateStr = '';
                let locationStr = '';
                let description = '';
                let link = '';

                while (current && current.tagName !== 'H4') {
                    if (current.tagName === 'A' && !title) {
                        title = current.innerText.trim();
                        link = current.getAttribute('href') || '';
                        if (link && !link.startsWith('http')) {
                            link = 'https://www.thalia.de' + link;
                        }
                    } else if (current.tagName === 'SPAN') {
                        const text = current.innerText.trim();
                        if (text.match(/\d{1,2}\.\s+[A-Za-zäöüÄÖÜ]+\s+\d{4}/)) {
                            dateStr = text;
                        } else {
                            locationStr = text;
                        }
                    } else if (current.tagName === 'DIV') {
                        description = current.innerText.trim();
                    }
                    current = current.nextElementSibling;
                }

                if (title && dateStr) {
                    // We return raw strings and parse them in Node to avoid passing complex objects
                    eventsList.push({
                        title,
                        dateStr,
                        locationStr,
                        description,
                        link
                    });
                }
            });
            return eventsList;
        });

        await browser.close();

        // Process events in Node
        const processedEvents = events.map((e, i) => {
            const dateMatch = e.dateStr.match(/(\d{1,2})\.\s+([A-Za-zäöüÄÖÜ]+)\s+(\d{4})/);
            let date = new Date();
            if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const monthName = dateMatch[2];
                const year = parseInt(dateMatch[3]);

                const months = {
                    'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
                    'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
                };

                if (months[monthName] !== undefined) {
                    date = new Date(year, months[monthName], day);
                    const timeMatch = e.dateStr.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
                    }
                }
            }

            let lat = 51.1657;
            let lng = 10.4515;
            lat += (Math.random() - 0.5) * 5;
            lng += (Math.random() - 0.5) * 5;

            return {
                id: `thalia-${i}-${Date.now()}`,
                title: e.title,
                author: e.title,
                date: date.toISOString(),
                location: {
                    name: e.locationStr,
                    address: e.locationStr,
                    lat: lat,
                    lng: lng
                },
                price: {
                    amount: 0,
                    currency: 'EUR'
                },
                description: e.description,
                url: e.link,
                source: 'Thalia'
            };
        });

        console.log(`Found ${processedEvents.length} events from Thalia.`);
        return processedEvents;

    } catch (error) {
        console.error("Error scraping Thalia with Puppeteer:", error);
        if (browser) await browser.close();
        return [];
    }
}
