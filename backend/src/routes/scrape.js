const logger = require('../utils/logger');
const ScrapeLog = require('../models/ScrapeLog');

const router = require('express').Router();

/**
 * POST /api/scrape/trigger
 * Manually trigger a scrape for one or all sites.
 * Query params: ?site=alljobs (optional, scrape all if omitted)
 */
router.post('/trigger', async (req, res) => {
    try {
        const { site, daysBack } = req.query;
        const { startScraping } = require('../scheduler');
        const days = parseInt(daysBack, 10) || null;

        // Fire and forget — scraping happens in background
        if (site) {
            logger.info(`Manual scrape triggered for site: ${site}, daysBack: ${days || 'default'}`);
            startScraping(site, { daysBack: days });
        } else {
            logger.info(`Manual scrape triggered for all sites, daysBack: ${days || 'default'}`);
            startScraping(null, { daysBack: days });
        }

        res.json({
            message: `Scraping ${site || 'all sites'} triggered. Check logs for progress.`,
            status: 'started',
        });
    } catch (error) {
        logger.error('Error triggering scrape', { error: error.message });
        res.status(500).json({ error: 'Failed to trigger scrape' });
    }
});

/**
 * GET /api/scrape/status
 * Get recent scrape log entries.
 */
router.get('/status', async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

        const logs = await ScrapeLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Map _id to id for API compatibility
        const mappedLogs = logs.map(log => {
            log.id = log._id.toString();
            delete log._id;
            delete log.__v;
            return log;
        });

        res.json({ logs: mappedLogs });
    } catch (error) {
        logger.error('Error fetching scrape status', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch scrape status' });
    }
});

/**
 * GET /api/scrape/sites
 * Get all scraper sites with their last run info.
 */
router.get('/sites', async (req, res) => {
    try {
        const { SOURCE_SITES } = require('../utils/constants');

        // Aggregate last log entry per site
        const lastRuns = await ScrapeLog.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$site',
                    status: { $first: '$status' },
                    jobsFound: { $first: '$jobsFound' },
                    jobsNew: { $first: '$jobsNew' },
                    duration: { $first: '$duration' },
                    error: { $first: '$error' },
                    lastRun: { $first: '$createdAt' },
                }
            }
        ]);

        const lastRunMap = {};
        for (const entry of lastRuns) {
            lastRunMap[entry._id] = {
                status: entry.status,
                jobsFound: entry.jobsFound,
                jobsNew: entry.jobsNew,
                duration: entry.duration,
                error: entry.error,
                lastRun: entry.lastRun,
            };
        }

        const sites = Object.values(SOURCE_SITES).map(site => ({
            id: site.id,
            name: site.name,
            url: site.url,
            color: site.color,
            ...(lastRunMap[site.id] || {
                status: 'never',
                jobsFound: 0,
                jobsNew: 0,
                duration: 0,
                error: null,
                lastRun: null,
            }),
        }));

        res.json({ sites });
    } catch (error) {
        logger.error('Error fetching scraper sites', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch scraper sites' });
    }
});

module.exports = router;
