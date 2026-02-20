const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class SecretTelAvivScraper extends BaseScraper {
    constructor() {
        super('secrettelaviv', 'https://www.secrettelaviv.com');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs?page=${pageNum}`;
                logger.debug(`SecretTelAviv: Fetching page ${pageNum}`);

                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });

                if (!response.ok) {
                    logger.warn(`SecretTelAviv: HTTP ${response.status}`);
                    break;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                const pageJobs = [];

                $('article, .job-listing, [class*="job-item"], .listing-item').each((_, el) => {
                    const $el = $(el);
                    const titleEl = $el.find('h2 a, h3 a, [class*="title"] a, a[href*="job"]').first();
                    const company = $el.find('[class*="company"], .employer').first().text().trim();
                    const location = $el.find('[class*="location"]').first().text().trim();
                    const description = $el.find('[class*="description"], .excerpt, p').first().text().trim();

                    const title = titleEl.text().trim();
                    const href = titleEl.attr('href');

                    if (title && href) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        pageJobs.push({
                            title,
                            company: company || null,
                            location: location || 'Tel Aviv',
                            city: location || 'Tel Aviv',
                            description,
                            url: fullUrl,
                            sourceUrl: fullUrl,
                        });
                    }
                });

                jobs.push(...pageJobs);
                if (pageJobs.length === 0) break;
            }
        } catch (error) {
            logger.error(`SecretTelAviv scrape error: ${error.message}`);
        }

        logger.info(`SecretTelAviv: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = SecretTelAvivScraper;
