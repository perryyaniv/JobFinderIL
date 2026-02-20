const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');

let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    logger.warn('Puppeteer not available');
}

class EthosiaScraper extends BaseScraper {
    constructor() {
        super('ethosia', 'https://www.ethosia.co.il');
    }

    async scrape(searchParams = {}) {
        if (!puppeteer) return [];

        const browser = await puppeteer.launch({
            headless: 'new',
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs/?page=${pageNum}`;
                logger.debug(`Ethosia: Fetching page ${pageNum}`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                } catch (navError) {
                    logger.warn(`Ethosia: Navigation failed for page ${pageNum}: ${navError.message}`);
                    break;
                }
                await page.waitForSelector('[class*="job"], [class*="position"], .card', { timeout: 10000 }).catch(() => { });

                const pageJobs = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('[class*="job-item"], [class*="position"], .job-card, article');

                    cards.forEach(card => {
                        try {
                            const titleEl = card.querySelector('h2, h3, [class*="title"], a[href*="job"]');
                            const companyEl = card.querySelector('[class*="company"]');
                            const locationEl = card.querySelector('[class*="location"]');
                            const linkEl = card.querySelector('a[href*="job"]') || titleEl?.closest('a');

                            const title = titleEl?.textContent?.trim();
                            const href = linkEl?.href;

                            if (title && href) {
                                results.push({
                                    title,
                                    company: companyEl?.textContent?.trim() || 'Ethosia',
                                    location: locationEl?.textContent?.trim() || null,
                                    url: href,
                                });
                            }
                        } catch (e) { }
                    });
                    return results;
                });

                for (const job of pageJobs) {
                    jobs.push({ ...job, titleHe: job.title, companyVerified: true, city: job.location, sourceUrl: job.url });
                }

                if (pageJobs.length === 0) break;
                await delay(this.delayBetweenPages);
            }
        } finally {
            await browser.close();
        }

        logger.info(`Ethosia: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = EthosiaScraper;
