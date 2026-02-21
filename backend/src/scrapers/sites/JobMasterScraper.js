const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
const { launchBrowser } = require('../../utils/browser');

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

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs?page=${pageNum}`;
                logger.debug(`JobMaster: Fetching page ${pageNum}: ${url}`);

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('.job-item, .job-card, [class*="JobCard"]', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('.job-item, .job-card, [class*="JobCard"], [class*="job-list"] > div');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('a[href*="job"], h3 a, .job-title');
                            const companyEl = card.querySelector('[class*="company"], .employer-name');
                            const locationEl = card.querySelector('[class*="location"], [class*="city"]');
                            const typeEl = card.querySelector('[class*="type"], [class*="scope"]');

                            const title = titleEl?.textContent?.trim();
                            const href = titleEl?.href || titleEl?.closest('a')?.href;

                            if (title && href) {
                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || null,
                                    location: locationEl?.textContent?.trim() || null,
                                    jobType: typeEl?.textContent?.trim() || null,
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

        logger.info(`JobMaster: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = JobMasterScraper;
