const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

/**
 * xPlace scraper — primarily a freelancer marketplace.
 * Job listings are categorized by field (web, design, dev, etc.).
 */
class XPlaceScraper extends BaseScraper {
    constructor() {
        super('xplace', 'https://www.xplace.com');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        // xPlace has category-based job pages
        const categories = [
            { path: '/web/jobs', name: 'WEB' },
            { path: '/dev/jobs', name: 'תוכנה' },
            { path: '/design/jobs', name: 'עיצוב' },
            { path: '/marketing/jobs', name: 'שיווק' },
            { path: '/writing/jobs', name: 'כתיבה' },
        ];

        for (const category of categories) {
            try {
                const url = `${this.baseUrl}${category.path}`;
                logger.debug(`xPlace: Fetching ${url}`);

                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });

                if (!response.ok) continue;

                const html = await response.text();
                const $ = cheerio.load(html);

                $('[class*="result"], [class*="item"], [class*="job"], article, .card').each((_, el) => {
                    const $el = $(el);
                    const titleEl = $el.find('h2, h3, [class*="title"], a').first();
                    const title = titleEl.text().trim();
                    const href = titleEl.attr('href') || $el.find('a').first().attr('href');

                    if (title && href && title.length > 3) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        jobs.push({
                            title,
                            category: category.name,
                            url: fullUrl,
                            sourceUrl: fullUrl,
                        });
                    }
                });
            } catch (error) {
                logger.debug(`xPlace: ${category.path} error: ${error.message}`);
            }
        }

        if (jobs.length === 0) {
            logger.warn('xPlace: No jobs found (freelancer marketplace, limited job listings)');
        } else {
            logger.info(`xPlace: Scraped ${jobs.length} jobs`);
        }

        return jobs;
    }
}

module.exports = XPlaceScraper;
