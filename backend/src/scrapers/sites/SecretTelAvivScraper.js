const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class SecretTelAvivScraper extends BaseScraper {
    constructor() {
        // Site now redirects to jobs.secrettelaviv.com
        super('secrettelaviv', 'https://jobs.secrettelaviv.com');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            const url = `${this.baseUrl}/`;
            logger.debug(`SecretTelAviv: Fetching ${url}`);

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            });

            if (!response.ok) {
                logger.warn(`SecretTelAviv: HTTP ${response.status}`);
                return [];
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // WPJobBoard plugin: .wpjb-grid-row with .wpjb-col-title a
            $('.wpjb-grid-row').each((_, el) => {
                const $el = $(el);
                const titleEl = $el.find('.wpjb-col-title a').first();
                const companyEl = $el.find('.wpjb-sub').first();

                const title = titleEl.text().trim();
                const href = titleEl.attr('href');

                if (title && href) {
                    jobs.push({
                        title,
                        company: companyEl.text().trim() || null,
                        city: 'Tel Aviv',
                        url: href,
                        sourceUrl: href,
                    });
                }
            });
        } catch (error) {
            logger.error(`SecretTelAviv scrape error: ${error.message}`);
        }

        logger.info(`SecretTelAviv: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = SecretTelAvivScraper;
