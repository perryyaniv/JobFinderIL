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
            const url = `${this.baseUrl}/jobs`;
            logger.debug(`Janglo: Fetching ${url}`);

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            });

            if (!response.ok) {
                logger.warn(`Janglo: HTTP ${response.status}`);
                return [];
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Janglo uses .itemlistingnp cards with h3 for title, relative item/XXX links
            $('.itemlistingnp').each((_, el) => {
                const $el = $(el);
                const titleEl = $el.find('h3').first();
                const linkEl = $el.find('a[href^="item/"]').first();
                const dateEl = $el.find('.thedate').first();

                const title = titleEl.text().trim();
                const href = linkEl.attr('href');

                if (title && href) {
                    const fullUrl = `${this.baseUrl}/jobs/${href}`;
                    const dateText = dateEl.text().trim();

                    jobs.push({
                        title,
                        url: fullUrl,
                        sourceUrl: fullUrl,
                        postedAt: dateText ? new Date(dateText) : null,
                    });
                }
            });
        } catch (error) {
            logger.error(`Janglo scrape error: ${error.message}`);
        }

        logger.info(`Janglo: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = JangloScraper;
