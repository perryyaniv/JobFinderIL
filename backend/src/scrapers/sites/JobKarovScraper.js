const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');

let puppeteer;
try { puppeteer = require('puppeteer'); } catch (e) { }

class JobKarovScraper extends BaseScraper {
    constructor() {
        super('jobkarov', 'https://www.jobkarov.com');
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

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs?page=${pageNum}`;
                logger.debug(`JobKarov: Fetching page ${pageNum}`);
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('[class*="job"], .card, article', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    document.querySelectorAll('[class*="job-card"], [class*="job-item"], article, .card').forEach(card => {
                        try {
                            const titleEl = card.querySelector('h2, h3, [class*="title"]');
                            const companyEl = card.querySelector('[class*="company"]');
                            const locationEl = card.querySelector('[class*="location"], [class*="city"]');
                            const linkEl = card.querySelector('a[href*="job"]') || titleEl?.closest('a') || card.querySelector('a');
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
        logger.info(`JobKarov: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = JobKarovScraper;
