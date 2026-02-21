const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
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

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs?page=${pageNum}`;
                logger.debug(`Taasiya: Fetching page ${pageNum}`);

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('[class*="job"], .result, article', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    document.querySelectorAll('[class*="job-item"], article, .result-item, tr[class*="job"]').forEach(card => {
                        try {
                            const titleEl = card.querySelector('h2, h3, [class*="title"], a[href*="job"]');
                            const companyEl = card.querySelector('[class*="company"]');
                            const locationEl = card.querySelector('[class*="location"]');
                            const linkEl = card.querySelector('a[href]');

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
                    jobs.push({ ...job, titleHe: job.title, city: job.location, sourceUrl: job.url });
                }
                if (pageJobs.length === 0) break;
                await delay(this.delayBetweenPages);
            }
        } finally { await browser.close(); }

        logger.info(`Taasiya: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = TaasiyaScraper;
