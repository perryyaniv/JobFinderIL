const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');

let puppeteer;
try { puppeteer = require('puppeteer'); } catch (e) { }

class GlassdoorScraper extends BaseScraper {
    constructor() {
        super('glassdoor', 'https://www.glassdoor.com');
    }

    async scrape(searchParams = {}) {
        if (!puppeteer) return [];

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            for (let pageNum = 1; pageNum <= Math.min(this.maxPages, 3); pageNum++) {
                const url = pageNum === 1
                    ? `${this.baseUrl}/Job/israel-jobs-SRCH_IL.0,6_IN119.htm`
                    : `${this.baseUrl}/Job/israel-jobs-SRCH_IL.0,6_IN119_IP${pageNum}.htm`;

                logger.debug(`Glassdoor: Fetching page ${pageNum}`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                    await page.waitForSelector('[class*="JobCard"], [data-test="jobListing"], li[class*="job"]', { timeout: 10000 }).catch(() => { });

                    const pageJobs = await page.evaluate(() => {
                        const results = [];
                        document.querySelectorAll('[class*="JobCard"], [data-test="jobListing"], li[class*="job"]').forEach(card => {
                            try {
                                const titleEl = card.querySelector('[class*="jobTitle"], [data-test="job-title"], a[class*="job"]');
                                const companyEl = card.querySelector('[class*="EmployerProfile"], [data-test="emp-name"]');
                                const locationEl = card.querySelector('[class*="location"], [data-test="emp-location"]');
                                const salaryEl = card.querySelector('[class*="salary"], [data-test="detailSalary"]');
                                const linkEl = card.querySelector('a[href*="/job-listing/"]') || titleEl?.closest('a');

                                const title = titleEl?.textContent?.trim();
                                const href = linkEl?.href;

                                if (title && href) {
                                    results.push({
                                        title,
                                        company: companyEl?.textContent?.trim() || null,
                                        location: locationEl?.textContent?.trim() || null,
                                        salary: salaryEl?.textContent?.trim() || null,
                                        url: href,
                                    });
                                }
                            } catch (e) { }
                        });
                        return results;
                    });

                    for (const job of pageJobs) {
                        jobs.push({ ...job, companyVerified: true, city: job.location, sourceUrl: job.url });
                    }

                    if (pageJobs.length === 0) break;
                } catch (error) {
                    logger.warn(`Glassdoor page ${pageNum} failed: ${error.message}`);
                    break;
                }

                await delay(3000);
            }
        } finally { await browser.close(); }

        logger.info(`Glassdoor: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = GlassdoorScraper;
