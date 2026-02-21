const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

class TaasiyaScraper extends BaseScraper {
    constructor() {
        super('taasiya', 'https://www.taasiya.co.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            const url = `${this.baseUrl}/jobs/`;
            logger.debug(`Taasiya: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Taasiya uses .resultItem with .resultItem_mid (title) and .resultItem_right (type)
            await page.waitForSelector('.resultItem', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate((baseUrl) => {
                const results = [];
                const cards = document.querySelectorAll('.resultItem');

                cards.forEach(card => {
                    try {
                        const titleEl = card.querySelector('.resultItem_mid a');
                        const typeEl = card.querySelector('.resultItem_right a');

                        const title = titleEl?.textContent?.trim();
                        const href = titleEl?.getAttribute('href');

                        if (title && href) {
                            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
                            results.push({
                                title,
                                jobType: typeEl?.textContent?.trim() || null,
                                url: fullUrl,
                            });
                        }
                    } catch (e) { }
                });

                return results;
            }, this.baseUrl);

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    titleHe: job.title,
                    sourceUrl: job.url,
                });
            }
        } finally {
            await browser.close();
        }

        logger.info(`Taasiya: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = TaasiyaScraper;
