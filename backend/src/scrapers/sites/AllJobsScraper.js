const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');

let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    logger.warn('Puppeteer not available — AllJobs scraper will not function');
}

class AllJobsScraper extends BaseScraper {
    constructor() {
        super('alljobs', 'https://www.alljobs.co.il');
    }

    async scrape(searchParams = {}) {
        if (!puppeteer) return [];

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/SearchResultsGuest.aspx?page=${pageNum}&position=${searchParams.query || ''}&type=&source=&duration=0&exc=&region=`;
                logger.debug(`AllJobs: Fetching page ${pageNum}: ${url}`);

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('.open-board, .job-content-top', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('.open-board, [class*="job-item"]');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('a[class*="job-title"], h2 a, .job-content-top a');
                            const companyEl = card.querySelector('[class*="company"], .T14');
                            const locationEl = card.querySelector('[class*="location"], .job-location');
                            const dateEl = card.querySelector('[class*="date"], .job-date');
                            const descEl = card.querySelector('[class*="description"], .job-content-bottom');

                            const title = titleEl?.textContent?.trim();
                            const url = titleEl?.href;

                            if (title && url) {
                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || null,
                                    location: locationEl?.textContent?.trim() || null,
                                    postedAtText: dateEl?.textContent?.trim() || null,
                                    description: descEl?.textContent?.trim() || null,
                                    url,
                                });
                            }
                        } catch (e) {
                            // Skip malformed card
                        }
                    });

                    return results;
                });

                for (const job of pageJobs) {
                    jobs.push({
                        ...job,
                        titleHe: job.title,
                        city: job.location,
                        sourceUrl: job.url,
                    });
                }

                if (pageJobs.length === 0) break;
                await delay(this.delayBetweenPages);
            }
        } finally {
            await browser.close();
        }

        logger.info(`AllJobs: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = AllJobsScraper;
