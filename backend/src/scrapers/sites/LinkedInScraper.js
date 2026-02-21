const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');
const { delay } = require('../../utils/helpers');
const { launchBrowser } = require('../../utils/browser');

class LinkedInScraper extends BaseScraper {
    constructor() {
        super('linkedin', 'https://www.linkedin.com');
    }

    async scrape(searchParams = {}) {
        const browser = await launchBrowser();
        if (!browser) return [];

        const jobs = [];

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // LinkedIn public job search (no login required)
            for (let pageNum = 0; pageNum < this.maxPages; pageNum++) {
                const start = pageNum * 25;
                const query = searchParams.query ? `&keywords=${encodeURIComponent(searchParams.query)}` : '';
                const url = `${this.baseUrl}/jobs-guest/jobs/api/seeMoreJobPostings/search?location=Israel&start=${start}${query}`;

                logger.debug(`LinkedIn: Fetching page ${pageNum + 1}`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                    const pageJobs = await page.evaluate(() => {
                        const results = [];
                        const cards = document.querySelectorAll('li');

                        cards.forEach(card => {
                            try {
                                const titleEl = card.querySelector('.base-search-card__title, h3');
                                const companyEl = card.querySelector('.base-search-card__subtitle, h4');
                                const locationEl = card.querySelector('.job-search-card__location');
                                const linkEl = card.querySelector('a.base-card__full-link, a[href*="linkedin.com/jobs"]');
                                const dateEl = card.querySelector('time');

                                const title = titleEl?.textContent?.trim();
                                const href = linkEl?.href;

                                if (title && href) {
                                    results.push({
                                        title,
                                        company: companyEl?.textContent?.trim() || null,
                                        location: locationEl?.textContent?.trim() || null,
                                        postedAt: dateEl?.getAttribute('datetime') || null,
                                        url: href.split('?')[0], // Clean tracking params
                                    });
                                }
                            } catch (e) {
                                // Skip
                            }
                        });

                        return results;
                    });

                    for (const job of pageJobs) {
                        jobs.push({
                            ...job,
                            companyVerified: true, // LinkedIn companies are verified
                            city: job.location,
                            sourceUrl: job.url,
                            postedAt: job.postedAt ? new Date(job.postedAt) : null,
                        });
                    }

                    if (pageJobs.length === 0) break;
                } catch (error) {
                    logger.warn(`LinkedIn page ${pageNum + 1} failed: ${error.message}`);
                    break;
                }

                await delay(3000); // Be respectful to LinkedIn
            }
        } finally {
            await browser.close();
        }

        logger.info(`LinkedIn: Scraped ${jobs.length} jobs`);
        return jobs;
    }
}

module.exports = LinkedInScraper;
