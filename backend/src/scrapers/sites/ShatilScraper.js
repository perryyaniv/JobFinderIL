const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * Shatil scraper — shatil.org.il/jobs returns 404.
 * Uses Puppeteer to try alternative URLs and handle site changes.
 */
class ShatilScraper extends BaseScraper {
    constructor() {
        super('shatil', 'https://www.shatil.org.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Try multiple possible job page URLs
            const urls = [
                `${this.baseUrl}/jobs`,
                `${this.baseUrl}/careers`,
                `${this.baseUrl}/דרושים`,
                `${this.baseUrl}/משרות`,
            ];

            for (const url of urls) {
                try {
                    logger.debug(`Shatil: Trying ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

                    const status = await page.evaluate(() => ({
                        title: document.title,
                        is404: document.title.includes('404') || document.body.innerHTML.includes('Page not found'),
                    }));

                    if (status.is404) continue;

                    const pageJobs = await page.evaluate(() => {
                        const results = [];
                        document.querySelectorAll('article, [class*="job"], .views-row, [class*="listing"]').forEach(card => {
                            const titleEl = card.querySelector('h2 a, h3 a, [class*="title"] a');
                            const title = titleEl?.textContent?.trim();
                            const href = titleEl?.href;

                            if (title && href) {
                                results.push({ title, url: href });
                            }
                        });
                        return results;
                    });

                    for (const job of pageJobs) {
                        jobs.push({
                            ...job,
                            titleHe: job.title,
                            category: 'OTHER',
                            sourceUrl: job.url,
                        });
                    }

                    if (jobs.length > 0) break;
                } catch (navError) {
                    logger.debug(`Shatil: ${url} failed: ${navError.message}`);
                }
            }
        } finally {
            await browser.close();
        }

        if (jobs.length === 0) {
            logger.warn('Shatil: No active job page found');
        } else {
            logger.info(`Shatil: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = ShatilScraper;
