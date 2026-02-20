const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');

/**
 * Indeed scraper — Indeed aggressively blocks scrapers (403).
 * Uses their public RSS feed as a fallback.
 */
class IndeedScraper extends BaseScraper {
    constructor() {
        super('indeed', 'https://il.indeed.com');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            // Indeed provides RSS feeds for job searches
            const query = searchParams.query ? encodeURIComponent(searchParams.query) : '';
            const rssUrl = `${this.baseUrl}/rss?q=${query}&l=Israel&sort=date`;

            logger.debug(`Indeed: Fetching RSS feed: ${rssUrl}`);

            const response = await fetch(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                },
            });

            if (!response.ok) {
                logger.warn(`Indeed RSS returned ${response.status}`);
                return [];
            }

            const xml = await response.text();

            // Simple XML parsing for RSS items
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            let match;

            while ((match = itemRegex.exec(xml)) !== null) {
                const item = match[1];

                const title = this.extractTag(item, 'title');
                const link = this.extractTag(item, 'link');
                const description = this.extractTag(item, 'description');
                const pubDate = this.extractTag(item, 'pubDate');
                const source = this.extractTag(item, 'source');
                const location = this.extractTag(item, 'georss:point') || this.extractTag(item, 'indeed:location');

                if (title && link) {
                    jobs.push({
                        title,
                        company: source || null,
                        companyVerified: !!source,
                        description,
                        location,
                        city: location,
                        url: link,
                        sourceUrl: link,
                        postedAt: pubDate ? new Date(pubDate) : null,
                    });
                }
            }
        } catch (error) {
            logger.error(`Indeed scrape error: ${error.message}`);
        }

        logger.info(`Indeed: Scraped ${jobs.length} jobs via RSS`);
        return jobs;
    }

    extractTag(xml, tag) {
        const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : null;
    }
}

module.exports = IndeedScraper;
