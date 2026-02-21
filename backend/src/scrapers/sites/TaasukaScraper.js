const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * Taasuka (Israel Employment Service) scraper.
 * The site is a SPA with reCAPTCHA protection at /applicants/jobs/.
 * We scrape the main page for any visible job content.
 */
class TaasukaScraper extends BaseScraper {
    constructor() {
        super('taasuka', 'https://www.taasuka.gov.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Try the jobs search page
            const url = `${this.baseUrl}/applicants/jobs/`;
            logger.debug(`Taasuka: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for any dynamic content to load
            await page.waitForSelector('[class*="job"], [class*="result"], [class*="vacancy"], table tr', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate((baseUrl) => {
                const results = [];

                // Try to find job listings in various formats
                const selectors = [
                    '[class*="job-item"]', '[class*="vacancy"]', '[class*="result-item"]',
                    'table.jobs tr', '[class*="job-card"]',
                ];

                for (const sel of selectors) {
                    const cards = document.querySelectorAll(sel);
                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('h2, h3, [class*="title"], a[href]');
                            const linkEl = card.querySelector('a[href]');

                            const title = titleEl?.textContent?.trim();
                            const href = linkEl?.href;

                            if (title && href && title.length > 3 && title.length < 200) {
                                results.push({
                                    title,
                                    company: null,
                                    location: null,
                                    url: href,
                                });
                            }
                        } catch (e) { }
                    });

                    if (results.length > 0) break;
                }

                return results;
            }, this.baseUrl);

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    titleHe: job.title,
                    city: job.location,
                    sourceUrl: job.url,
                });
            }
        } finally {
            await browser.close();
        }

        if (jobs.length === 0) {
            logger.warn('Taasuka: No jobs found (SPA with reCAPTCHA, limited scraping capability)');
        } else {
            logger.info(`Taasuka: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = TaasukaScraper;
