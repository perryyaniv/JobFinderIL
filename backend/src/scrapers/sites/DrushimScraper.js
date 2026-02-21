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
                // Default page shows categories, not listings — use search URL with a term
                const query = searchParams.query || 'דרושים';
                const url = `${this.baseUrl}/jobs/search/${encodeURIComponent(query)}/?page=${pageNum}&ssaen=1`;

                logger.debug(`Drushim: Fetching page ${pageNum}: ${url}`);
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                // Drushim uses Vue.js; vacancy cards are .jobList_vacancy
                await page.waitForSelector('.jobList_vacancy', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('.jobList_vacancy');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('h3');
                            const companyEl = card.querySelector('a.disabledLink span') || card.querySelector('p.disabledLink');
                            const locationEl = card.querySelector('span.display-18');
                            const linkEl = card.querySelector('a[href*="/job/"]');

                            const title = titleEl?.textContent?.trim();
                            const url = linkEl?.href;

                            if (title && url) {
                                let location = locationEl?.textContent?.trim() || null;
                                if (location) location = location.replace(/\s*\|.*$/, '').trim();

                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || null,
                                    location,
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
