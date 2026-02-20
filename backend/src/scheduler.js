const cron = require('node-cron');
const logger = require('./utils/logger');
const { SOURCE_SITES } = require('./utils/constants');
const { delay } = require('./utils/helpers');
const deduplicationService = require('./services/DeduplicationService');

// Import all scraper adapters
const scraperMap = {};

function getScraperClass(siteId) {
    const scraperFiles = {
        alljobs: './scrapers/sites/AllJobsScraper',
        drushim: './scrapers/sites/DrushimScraper',
        jobmaster: './scrapers/sites/JobMasterScraper',
        linkedin: './scrapers/sites/LinkedInScraper',
        indeed: './scrapers/sites/IndeedScraper',
        gotfriends: './scrapers/sites/GotFriendsScraper',
        sqlink: './scrapers/sites/SqLinkScraper',
        ethosia: './scrapers/sites/EthosiaScraper',
        secrettelaviv: './scrapers/sites/SecretTelAvivScraper',
        janglo: './scrapers/sites/JangloScraper',
        taasuka: './scrapers/sites/TaasukaScraper',
        govil: './scrapers/sites/GovIlScraper',
        shatil: './scrapers/sites/ShatilScraper',
        taasiya: './scrapers/sites/TaasiyaScraper',
        jobkarov: './scrapers/sites/JobKarovScraper',
        xplace: './scrapers/sites/XPlaceScraper',
        nbn: './scrapers/sites/NbnScraper',
        glassdoor: './scrapers/sites/GlassdoorScraper',
    };

    if (!scraperMap[siteId]) {
        try {
            const ScraperClass = require(scraperFiles[siteId]);
            scraperMap[siteId] = new ScraperClass();
        } catch (error) {
            logger.warn(`Scraper not implemented yet for ${siteId}: ${error.message}`);
            return null;
        }
    }

    return scraperMap[siteId];
}

/**
 * Run scraping for a single site or all sites.
 */
async function startScraping(siteId = null) {
    const sites = siteId
        ? [siteId]
        : Object.values(SOURCE_SITES).map(s => s.id);

    const results = [];

    for (const id of sites) {
        const scraper = getScraperClass(id);
        if (!scraper) {
            logger.warn(`Skipping ${id} — scraper not available`);
            continue;
        }

        try {
            const result = await scraper.run();
            results.push(result);
        } catch (error) {
            logger.error(`Scraper ${id} threw an unexpected error`, { error: error.message });
            results.push({ site: id, status: 'failed', error: error.message });
        }

        // Stagger scrapes to avoid resource spikes
        if (sites.indexOf(id) < sites.length - 1) {
            await delay(5000);
        }
    }

    // Run deduplication across all sites after scraping
    try {
        // Mark stale jobs
        for (const siteInfo of Object.values(SOURCE_SITES)) {
            await deduplicationService.markStaleJobs(siteInfo.id, 72);
        }

        logger.info('Post-scrape deduplication and cleanup complete');
    } catch (error) {
        logger.error('Post-scrape cleanup failed', { error: error.message });
    }

    // Summary
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const totalJobs = successful.reduce((sum, r) => sum + (r.jobsFound || 0), 0);
    const newJobs = successful.reduce((sum, r) => sum + (r.jobsNew || 0), 0);

    logger.info(`Scraping complete: ${successful.length} succeeded, ${failed.length} failed, ${totalJobs} total jobs, ${newJobs} new`);

    return results;
}

/**
 * Initialize the cron scheduler for periodic scraping.
 */
function initScheduler() {
    const intervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS, 10) || 6;

    // Run every N hours
    const cronExpression = `0 */${intervalHours} * * *`;

    cron.schedule(cronExpression, async () => {
        logger.info(`Scheduled scrape starting (every ${intervalHours}h)...`);
        await startScraping();
    });

    logger.info(`Scrape scheduler initialized: running every ${intervalHours} hours`);
}

module.exports = { startScraping, initScheduler };
