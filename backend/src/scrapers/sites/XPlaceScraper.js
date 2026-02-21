const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
const { launchBrowser } = require('../../utils/browser');

class XPlaceScraper extends BaseScraper {
    constructor() {
        super('xplace', 'https://www.xplace.com');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];
        const jobs = [];
        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            const url = `${this.baseUrl}/il/jobs`;
            logger.debug(`xPlace: Fetching jobs`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector('[class*="job"], .listing, article', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate(() => {
                const results = [];
                document.querySelectorAll('[class*="job-item"], [class*="listing"], article, .card').forEach(card => {
                    try {
                        const titleEl = card.querySelector('h2, h3, [class*="title"]');
                        const companyEl = card.querySelector('[class*="company"]');
                        const locationEl = card.querySelector('[class*="location"]');
                        const linkEl = card.querySelector('a[href*="job"]') || titleEl?.closest('a') || card.querySelector('a');
                        const title = titleEl?.textContent?.trim();
                        const href = linkEl?.href;
                        if (title && href) {
                            results.push({
                                title, company: companyEl?.textContent?.trim() || null,
                                location: locationEl?.textContent?.trim() || null, url: href,
                            });
                        }
                    } catch (e) { }
                });
                return results;
            });

            for (const job of pageJobs) {
                jobs.push({ ...job, city: job.location, sourceUrl: job.url });
            }
        } finally { await browser.close(); }
        logger.info(`xPlace: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = XPlaceScraper;
