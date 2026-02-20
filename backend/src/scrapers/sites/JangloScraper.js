const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class JangloScraper extends BaseScraper {
    constructor() {
        super('janglo', 'https://www.janglo.net');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobs?page=${pageNum}`;
                logger.debug(`Janglo: Fetching page ${pageNum}`);

                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });

                if (!response.ok) break;
                const html = await response.text();
                const $ = cheerio.load(html);

                const pageJobs = [];

                $('.job-listing, .views-row, [class*="job-item"], .node--type-job, article').each((_, el) => {
                    const $el = $(el);
                    const titleEl = $el.find('h2 a, h3 a, .field--name-title a, [class*="title"] a').first();
                    const company = $el.find('[class*="company"], .field--name-field-company').first().text().trim();
                    const location = $el.find('[class*="location"], .field--name-field-location').first().text().trim();
                    const type = $el.find('[class*="type"], .field--name-field-job-type').first().text().trim();

                    const title = titleEl.text().trim();
                    const href = titleEl.attr('href');

                    if (title && href) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        pageJobs.push({
                            title,
                            company: company || null,
                            location: location || null,
                            city: location || null,
                            jobType: type || null,
                            url: fullUrl,
                            sourceUrl: fullUrl,
                        });
                    }
                });

                jobs.push(...pageJobs);
                if (pageJobs.length === 0) break;
            }
        } catch (error) {
            logger.error(`Janglo scrape error: ${error.message}`);
        }

        logger.info(`Janglo: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = JangloScraper;
