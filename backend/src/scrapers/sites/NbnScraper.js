const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class NbnScraper extends BaseScraper {
    constructor() {
        super('nbn', 'https://www.nbn.org.il');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
                const url = `${this.baseUrl}/jobboard/?pg=${pageNum}`;
                logger.debug(`NBN: Fetching page ${pageNum}`);

                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });

                if (!response.ok) break;
                const html = await response.text();
                const $ = cheerio.load(html);

                const pageJobs = [];

                $('.job-listing, .job-item, article, tr, [class*="job"]').each((_, el) => {
                    const $el = $(el);
                    const titleEl = $el.find('a[href*="jobboard"], h3, h4, [class*="title"]').first();
                    const company = $el.find('[class*="company"], .employer, td:nth-child(2)').first().text().trim();
                    const location = $el.find('[class*="location"], td:nth-child(3)').first().text().trim();

                    const title = titleEl.text().trim();
                    const href = titleEl.attr('href') || $el.find('a').first().attr('href');

                    if (title && href && title.length > 3) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        pageJobs.push({
                            title,
                            company: company || null,
                            location: location || null,
                            city: location || null,
                            url: fullUrl,
                            sourceUrl: fullUrl,
                        });
                    }
                });

                jobs.push(...pageJobs);
                if (pageJobs.length === 0) break;
            }
        } catch (error) {
            logger.error(`NBN scrape error: ${error.message}`);
        }

        logger.info(`NBN: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = NbnScraper;
