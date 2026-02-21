const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
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

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/career/jobs/?page=${pageNum}`;
                logger.debug(`SQLink: Fetching page ${pageNum}`);

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('[class*="job"], [class*="career"], .position-item', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('[class*="job-item"], [class*="position-item"], [class*="career-item"], [class*="JobCard"]');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('h2, h3, [class*="title"], a');
                            const locationEl = card.querySelector('[class*="location"], [class*="area"]');
                            const categoryEl = card.querySelector('[class*="category"], [class*="field"]');
                            const linkEl = card.querySelector('a[href*="career"], a[href*="job"]') || titleEl?.closest('a');

                            const title = titleEl?.textContent?.trim();
                            const href = linkEl?.href;

                            if (title && href) {
                                results.push({
                                    title,
                                    company: 'SQLink',
                                    location: locationEl?.textContent?.trim() || null,
                                    category: categoryEl?.textContent?.trim() || null,
                                    url: href,
                                });
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
                        companyVerified: true,
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

        logger.info(`SQLink: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = SqLinkScraper;
