const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { launchBrowser } = require('../../utils/browser');

/**
 * Gov.il scraper — API returns 403 to plain fetch.
 * Uses Puppeteer to access the careers page.
 */
class GovIlScraper extends BaseScraper {
    constructor() {
        super('govil', 'https://www.gov.il');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) {
            logger.warn('GovIl: No browser available, skipping');
            return [];
        }

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Try the API endpoint first via Puppeteer (bypasses 403)
            const apiUrl = `${this.baseUrl}/he/api/PublicationApi/Index?limit=50&OfficeId=&Skip=0&PublicationType=7`;
            logger.debug(`GovIl: Fetching API via browser: ${apiUrl}`);

            try {
                await page.goto(apiUrl, { waitUntil: 'networkidle2', timeout: 20000 });
                const apiData = await page.evaluate(() => {
                    try {
                        return JSON.parse(document.body.innerText);
                    } catch { return null; }
                });

                if (apiData && Array.isArray(apiData.results)) {
                    for (const item of apiData.results) {
                        const title = item.Title || item.title;
                        if (title) {
                            jobs.push({
                                title,
                                titleHe: title,
                                company: item.OfficeName || 'ממשלת ישראל',
                                companyVerified: true,
                                city: item.Location || null,
                                description: item.Description || null,
                                url: `${this.baseUrl}${item.UrlName || item.url || ''}`,
                                sourceUrl: `${this.baseUrl}${item.UrlName || item.url || ''}`,
                                postedAt: item.PublishDate ? new Date(item.PublishDate) : null,
                            });
                        }
                    }
                }
            } catch (apiError) {
                logger.debug(`GovIl: API failed (${apiError.message}), trying HTML fallback`);
            }

            // If API returned nothing, try HTML scraping
            if (jobs.length === 0) {
                const htmlUrl = `${this.baseUrl}/he/departments/topics/careers/`;
                await page.goto(htmlUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                const htmlJobs = await page.evaluate((baseUrl) => {
                    const results = [];
                    document.querySelectorAll('a[href*="career"], a[href*="publication"]').forEach(el => {
                        const title = el.textContent?.trim();
                        const href = el.href;
                        if (title && href && title.length > 5 && title.length < 200) {
                            results.push({ title, url: href });
                        }
                    });
                    return results;
                }, this.baseUrl);

                for (const job of htmlJobs) {
                    jobs.push({
                        ...job,
                        titleHe: job.title,
                        company: 'ממשלת ישראל',
                        companyVerified: true,
                        sourceUrl: job.url,
                    });
                }
            }
        } catch (error) {
            logger.error(`GovIl scrape error: ${error.message}`);
        } finally {
            await browser.close();
        }

        logger.info(`GovIl: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = GovIlScraper;
