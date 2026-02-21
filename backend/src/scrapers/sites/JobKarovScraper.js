const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * JobKarov scraper — jobkarov.com/jobs returns 404.
 * Attempts to find the current job listing URL.
 */
class JobKarovScraper extends BaseScraper {
    constructor() {
        super('jobkarov', 'https://www.jobkarov.com');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Try multiple possible URLs
            const urls = [
                `${this.baseUrl}/jobs`,
                `${this.baseUrl}/משרות`,
                `${this.baseUrl}/`,
            ];

            for (const url of urls) {
                try {
                    logger.debug(`JobKarov: Trying ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

                    const pageJobs = await page.evaluate(() => {
                        const results = [];
                        document.querySelectorAll('[class*="job-card"], [class*="job-item"], article, .card').forEach(card => {
                            const titleEl = card.querySelector('h2, h3, [class*="title"]');
                            const linkEl = card.querySelector('a[href*="job"]') || titleEl?.closest('a') || card.querySelector('a');
                            const companyEl = card.querySelector('[class*="company"]');
                            const locationEl = card.querySelector('[class*="location"]');

                            const title = titleEl?.textContent?.trim();
                            const href = linkEl?.href;

                            if (title && href && title.length > 3) {
                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || null,
                                    location: locationEl?.textContent?.trim() || null,
                                    url: href,
                                });
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

                    if (jobs.length > 0) break;
                } catch (navError) {
                    logger.debug(`JobKarov: ${url} failed: ${navError.message}`);
                }
            }
        } finally {
            await browser.close();
        }

        if (jobs.length === 0) {
            logger.warn('JobKarov: No jobs found (site may have changed)');
        } else {
            logger.info(`JobKarov: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = JobKarovScraper;
