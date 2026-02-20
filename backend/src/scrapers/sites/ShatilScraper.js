const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class ShatilScraper extends BaseScraper {
    constructor() {
        super('shatil', 'https://www.shatil.org.il');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            const url = `${this.baseUrl}/jobs`;
            logger.debug(`Shatil: Fetching jobs page`);

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            });

            if (!response.ok) return [];
            const html = await response.text();
            const $ = cheerio.load(html);

            $('article, .job-item, .views-row, [class*="job"], .node--type-job').each((_, el) => {
                const $el = $(el);
                const titleEl = $el.find('h2 a, h3 a, [class*="title"] a').first();
                const company = $el.find('[class*="company"], [class*="organization"]').first().text().trim();
                const location = $el.find('[class*="location"]').first().text().trim();

                const title = titleEl.text().trim();
                const href = titleEl.attr('href');

                if (title && href) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    jobs.push({
                        title,
                        titleHe: title,
                        company: company || null,
                        location: location || null,
                        city: location || null,
                        category: 'OTHER',
                        url: fullUrl,
                        sourceUrl: fullUrl,
                    });
                }
            });
        } catch (error) {
            logger.error(`Shatil scrape error: ${error.message}`);
        }

        logger.info(`Shatil: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = ShatilScraper;
