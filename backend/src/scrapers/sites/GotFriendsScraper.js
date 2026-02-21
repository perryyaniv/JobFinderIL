const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

class GotFriendsScraper extends BaseScraper {
    constructor() {
        super('gotfriends', 'https://www.gotfriends.co.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            const url = `${this.baseUrl}/jobs/`;
            logger.debug(`GotFriends: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Cards are <a class="position" href="..."> with <h2 class="title"> inside
            await page.waitForSelector('a.position', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate((baseUrl) => {
                const results = [];
                const cards = document.querySelectorAll('a.position');

                cards.forEach(card => {
                    try {
                        const titleEl = card.querySelector('h2.title');
                        const title = titleEl?.textContent?.trim();
                        const href = card.getAttribute('href');

                        if (title && href) {
                            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
                            results.push({ title, url: fullUrl });
                        }
                    } catch (e) {
                        // Skip
                    }
                });

                return results;
            }, this.baseUrl);

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    titleHe: job.title,
                    company: 'GotFriends',
                    companyVerified: true,
                    sourceUrl: job.url,
                });
            }
        } finally {
            await browser.close();
        }

        logger.info(`GotFriends: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = GotFriendsScraper;
