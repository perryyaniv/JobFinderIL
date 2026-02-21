const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
const { launchBrowser } = require('../../utils/browser');

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

            const url = `${this.baseUrl}`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector('table, [class*="job"], .result-item', { timeout: 10000 }).catch(() => { });

            const pageJobs = await page.evaluate(() => {
                const results = [];
                const rows = document.querySelectorAll('table tr, [class*="job-item"], .result-item, [class*="vacancy"]');

                rows.forEach(row => {
                    try {
                        const cells = row.querySelectorAll('td');
                        const linkEl = row.querySelector('a[href]');

                        if (cells.length >= 2) {
                            const title = cells[0]?.textContent?.trim() || linkEl?.textContent?.trim();
                            const company = cells[1]?.textContent?.trim();
                            const location = cells[2]?.textContent?.trim();
                            const href = linkEl?.href;

                            if (title) {
                                results.push({
                                    title,
                                    company: company || null,
                                    location: location || null,
                                    url: href || window.location.href,
                                });
                            }
                        }
                    } catch (e) { }
                });

                return results;
            });

            for (const job of pageJobs) {
                jobs.push({ ...job, titleHe: job.title, city: job.location, sourceUrl: job.url });
            }
        } finally {
            await browser.close();
        }

        logger.info(`Taasuka: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = TaasukaScraper;
