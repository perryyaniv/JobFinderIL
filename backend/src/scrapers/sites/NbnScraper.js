const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * NBN (Nefesh B'Nefesh) scraper — site returns 403 to plain fetch,
 * so we use Puppeteer. Uses WordPress Job Manager plugin.
 */
class NbnScraper extends BaseScraper {
    constructor() {
        super('nbn', 'https://www.nbn.org.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            const url = `${this.baseUrl}/jobboard/`;
            logger.debug(`NBN: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // WordPress Job Manager: li.job_listing with data-title and data-href
            await page.waitForSelector('li.job_listing', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate(() => {
                const results = [];
                const items = document.querySelectorAll('li.job_listing');

                items.forEach(item => {
                    try {
                        const title = item.getAttribute('data-title');
                        const href = item.getAttribute('data-href');
                        const company = item.querySelector('.job_listing-company strong')?.textContent?.trim();
                        const location = item.querySelector('.job_listing-location')?.textContent?.trim();

                        if (title && href) {
                            results.push({ title, company, location, url: href });
                        }
                    } catch (e) { }
                });

                return results;
            });

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    city: job.location,
                    sourceUrl: job.url,
                });
            }
        } finally {
            await browser.close();
        }

        logger.info(`NBN: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = NbnScraper;
