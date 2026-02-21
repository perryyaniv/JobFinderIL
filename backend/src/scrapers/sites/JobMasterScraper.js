const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * JobMaster scraper — old ASP-based site with a search-centric interface.
 * The homepage loads a search form; we submit it to get results.
 */
class JobMasterScraper extends BaseScraper {
    constructor() {
        super('jobmaster', 'https://www.jobmaster.co.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // JobMaster requires submitting the search form on the homepage
            const url = `${this.baseUrl}/`;
            logger.debug(`JobMaster: Fetching ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Try to trigger a search (empty search = all jobs)
            try {
                // Look for search button and click it
                const searchBtn = await page.$('input[type="submit"], button[type="submit"], .searchBtn, [class*="search"] button');
                if (searchBtn) {
                    await searchBtn.click();
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });
                }
            } catch (e) {
                logger.debug(`JobMaster: Search submit failed: ${e.message}`);
            }

            // Try to find job listings on the results page
            const pageJobs = await page.evaluate(() => {
                const results = [];
                // Try various possible selectors
                const cards = document.querySelectorAll(
                    '[class*="job-item"], [class*="job-card"], [class*="JobCard"], ' +
                    '[class*="resultRow"], .boardRow, tr[onclick], ' +
                    'a[href*="ShowJob"], a[href*="showjob"]'
                );

                cards.forEach(card => {
                    try {
                        const titleEl = card.querySelector('a[href*="job"], h3 a, .job-title, [class*="title"]') || card;
                        const companyEl = card.querySelector('[class*="company"], .employer');
                        const locationEl = card.querySelector('[class*="location"], [class*="city"]');

                        const title = titleEl?.textContent?.trim();
                        const href = titleEl?.href || card.href || card.querySelector('a')?.href;

                        if (title && href && title.length > 3 && title.length < 200) {
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
            });

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
            logger.warn('JobMaster: No jobs found (complex ASP site, may need selector update)');
        } else {
            logger.info(`JobMaster: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = JobMasterScraper;
