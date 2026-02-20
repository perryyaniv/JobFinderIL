const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class GovIlScraper extends BaseScraper {
    constructor() {
        super('govil', 'https://www.gov.il');
    }

    async scrape(searchParams = {}) {
        const jobs = [];

        try {
            const url = `${this.baseUrl}/he/api/PublicationApi/Index?limit=50&OfficeId=&Skip=0&PublicationType=7`;
            logger.debug(`GovIl: Fetching careers API`);

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            });

            if (!response.ok) {
                // Fallback to HTML scraping
                const htmlUrl = `${this.baseUrl}/he/departments/topics/careers/`;
                const htmlResponse = await fetch(htmlUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });

                if (!htmlResponse.ok) return [];
                const html = await htmlResponse.text();
                const $ = cheerio.load(html);

                $('[class*="card"], article, .item, li a[href*="career"]').each((_, el) => {
                    const $el = $(el);
                    const titleEl = $el.find('h3, h4, [class*="title"]').first();
                    const title = titleEl.text().trim() || $el.text().trim();
                    const href = $el.find('a').attr('href') || $el.attr('href');

                    if (title && href) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        jobs.push({
                            title,
                            titleHe: title,
                            company: 'ממשלת ישראל',
                            companyVerified: true,
                            url: fullUrl,
                            sourceUrl: fullUrl,
                        });
                    }
                });

                return jobs;
            }

            const data = await response.json();
            if (data && Array.isArray(data.results)) {
                for (const item of data.results) {
                    jobs.push({
                        title: item.Title || item.title,
                        titleHe: item.Title || item.title,
                        company: item.OfficeName || 'ממשלת ישראל',
                        companyVerified: true,
                        location: item.Location || null,
                        city: item.Location || null,
                        description: item.Description || null,
                        url: `${this.baseUrl}${item.UrlName || item.url || ''}`,
                        sourceUrl: `${this.baseUrl}${item.UrlName || item.url || ''}`,
                        postedAt: item.PublishDate ? new Date(item.PublishDate) : null,
                    });
                }
            }
        } catch (error) {
            logger.error(`GovIl scrape error: ${error.message}`);
        }

        logger.info(`GovIl: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = GovIlScraper;
