const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

class SqLinkScraper extends BaseScraper {
    constructor() {
        super('sqlink', 'https://www.sqlink.com');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Main career page lists all positions (not /career/jobs/ which returns 404)
            const url = `${this.baseUrl}/career/`;
            logger.debug(`SQLink: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Positions use .positionItem container with h3 for title
            await page.waitForSelector('.positionItem', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.positionItem');

                cards.forEach(card => {
                    try {
                        const titleEl = card.querySelector('h3');
                        const linkEl = card.querySelector('a[href*="/career/"]');

                        const title = titleEl?.textContent?.trim();
                        const url = linkEl?.href;

                        if (title && url && !url.endsWith('/career/')) {
                            results.push({ title, url });
                        }
                    } catch (e) {
                        // Skip
                    }
                });

                return results;
            });

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    titleHe: job.title,
                    company: 'SQLink',
                    companyVerified: true,
                    sourceUrl: job.url,
                });
            }
        } finally {
            await browser.close();
        }

        logger.info(`SQLink: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = SqLinkScraper;
