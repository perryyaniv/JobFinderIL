const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
const { launchBrowser } = require('../../utils/browser');

class DrushimScraper extends BaseScraper {
    constructor() {
        super('drushim', 'https://www.drushim.co.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const query = searchParams.query ? encodeURIComponent(searchParams.query) : '';
                const url = query
                    ? `${this.baseUrl}/jobs/search/${query}/?page=${pageNum}&ssaen=1`
                    : `${this.baseUrl}/jobs/?page=${pageNum}`;

                logger.debug(`Drushim: Fetching page ${pageNum}: ${url}`);
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                // Wait for job cards to load
                await page.waitForSelector('[class*="job-item"], .job-card, .JobItem', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('[class*="job-item"], .job-card, .JobItem, [data-job-id]');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('a[class*="title"], h2 a, .job-title a, a[href*="/job/"]');
                            const companyEl = card.querySelector('[class*="company"], .company-name');
                            const locationEl = card.querySelector('[class*="location"], .job-location');
                            const categoryEl = card.querySelector('[class*="category"], .job-category');

                            const title = titleEl?.textContent?.trim();
                            const url = titleEl?.href;

                            if (title && url) {
                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || null,
                                    location: locationEl?.textContent?.trim() || null,
                                    category: categoryEl?.textContent?.trim() || null,
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

        logger.info(`Drushim: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = DrushimScraper;
