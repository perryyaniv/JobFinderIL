const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * Indeed scraper — Indeed discontinued their RSS feed (returns 404).
 * Now uses Puppeteer to scrape the web interface directly.
 */
class IndeedScraper extends BaseScraper {
    constructor() {
        super('indeed', 'https://il.indeed.com');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            const query = searchParams.query ? encodeURIComponent(searchParams.query) : '';
            const url = `${this.baseUrl}/jobs?q=${query}&l=Israel&sort=date`;
            logger.debug(`Indeed: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Indeed uses various card selectors
            await page.waitForSelector('.job_seen_beacon, .jobsearch-ResultsList, [data-jk]', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate((baseUrl) => {
                const results = [];
                const cards = document.querySelectorAll('.job_seen_beacon, .result, [data-jk]');

                cards.forEach(card => {
                    try {
                        const titleEl = card.querySelector('h2 a, .jobTitle a, [class*="jobTitle"] a');
                        const companyEl = card.querySelector('[data-testid="company-name"], .companyName, [class*="company"]');
                        const locationEl = card.querySelector('[data-testid="text-location"], .companyLocation, [class*="location"]');
                        const dateEl = card.querySelector('.date, [class*="date"]');

                        const title = titleEl?.textContent?.trim();
                        let href = titleEl?.href || titleEl?.getAttribute('href');
                        if (href && !href.startsWith('http')) href = baseUrl + href;

                        if (title && href) {
                            results.push({
                                title,
                                company: companyEl?.textContent?.trim() || null,
                                location: locationEl?.textContent?.trim() || null,
                                url: href,
                            });
                        }
                    } catch (e) { }
                });

                return results;
            }, this.baseUrl);

            for (const job of pageJobs) {
                jobs.push({
                    ...job,
                    city: job.location,
                    sourceUrl: job.url,
                });
            }
        } catch (error) {
            logger.error(`Indeed scrape error: ${error.message}`);
        } finally {
            await browser.close();
        }

        logger.info(`Indeed: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = IndeedScraper;
