const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * Ethosia scraper — ethosia.co.il has SSL certificate issues
 * (ERR_CERT_COMMON_NAME_INVALID). The /jobs/ path returns 404.
 * This scraper attempts to access the site but gracefully handles failures.
 */
class EthosiaScraper extends BaseScraper {
    constructor() {
        super('ethosia', 'https://www.ethosia.co.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Try the main careers/jobs page
            const urls = [
                `${this.baseUrl}/jobs/`,
                `${this.baseUrl}/careers/`,
                'https://ethosia.co.il/jobs/',
            ];

            for (const url of urls) {
                try {
                    logger.debug(`Ethosia: Trying ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

                    const pageTitle = await page.title();
                    if (pageTitle.includes('404') || pageTitle.includes('לא נמצא')) continue;

                    const pageJobs = await page.evaluate(() => {
                        const results = [];
                        const cards = document.querySelectorAll('[class*="job-item"], [class*="position"], .job-card, article, .card');

                        cards.forEach(card => {
                            try {
                                const titleEl = card.querySelector('h2, h3, [class*="title"], a[href*="job"]');
                                const linkEl = card.querySelector('a[href*="job"]') || titleEl?.closest('a');

                                const title = titleEl?.textContent?.trim();
                                const href = linkEl?.href;

                                if (title && href && title.length > 3) {
                                    results.push({ title, url: href });
                                }
                            } catch (e) { }
                        });
                        return results;
                    });

                    for (const job of pageJobs) {
                        jobs.push({
                            ...job,
                            titleHe: job.title,
                            company: 'Ethosia',
                            companyVerified: true,
                            sourceUrl: job.url,
                        });
                    }

                    if (jobs.length > 0) break;
                } catch (navError) {
                    logger.debug(`Ethosia: ${url} failed: ${navError.message}`);
                }
            }
        } finally {
            await browser.close();
        }

        if (jobs.length === 0) {
            logger.warn('Ethosia: Site has SSL/access issues, no jobs scraped');
        } else {
            logger.info(`Ethosia: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = EthosiaScraper;
