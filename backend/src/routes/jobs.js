const express = require('express');
const filterService = require('../services/FilterService');
const logger = require('../utils/logger');
const { SOURCE_SITES, CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, REGIONS_EN } = require('../utils/constants');

const router = express.Router();

/**
 * GET /api/jobs
 * List jobs with filters, sort, and pagination.
 * 
 * Query parameters:
 * - q: text search (title, company, description)
 * - category: job category
 * - city: city name
 * - region: region code
 * - remote: "true" to show only remote jobs
 * - hybrid: "true" to show only hybrid jobs
 * - jobType: comma-separated job types
 * - experienceLevel: comma-separated experience levels
 * - source: comma-separated source site IDs
 * - daysAgo: show jobs posted within N days
 * - hideUnknownEmployer: "true" to hide jobs without a company
 * - salaryMin: minimum salary
 * - salaryMax: maximum salary
 * - sort: date_desc, date_asc, company_asc, company_desc, salary_desc, salary_asc, relevance
 * - page: page number (default 1)
 * - limit: results per page (default 20, max 100)
 */
router.get('/', async (req, res) => {
    try {
        const result = await filterService.queryJobs(req.query);
        res.json(result);
    } catch (error) {
        logger.error('Error fetching jobs', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

/**
 * GET /api/jobs/stats
 * Get aggregated job statistics.
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await filterService.getStats();
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching stats', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/jobs/filters
 * Get available filter values for populating dropdowns.
 */
router.get('/filters', async (req, res) => {
    try {
        const options = await filterService.getFilterOptions();
        res.json(options);
    } catch (error) {
        logger.error('Error fetching filter options', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch filter options' });
    }
});

/**
 * GET /api/jobs/meta
 * Get static metadata (categories, job types, etc.) for building the UI.
 */
router.get('/meta', (req, res) => {
    res.json({
        categories: Object.entries(CATEGORIES).map(([key, val]) => ({ key, ...val })),
        jobTypes: Object.entries(JOB_TYPES).map(([key, val]) => ({ key, ...val })),
        experienceLevels: Object.entries(EXPERIENCE_LEVELS).map(([key, val]) => ({ key, ...val })),
        regions: Object.entries(REGIONS_EN).map(([key, val]) => ({ key, name: val })),
        sourceSites: Object.values(SOURCE_SITES).map(s => ({
            id: s.id,
            name: s.name,
            color: s.color,
        })),
    });
});

/**
 * POST /api/jobs/:id/favorite
 * Toggle favorite status of a job.
 */
router.post('/:id/favorite', async (req, res) => {
    try {
        const result = await filterService.toggleFavorite(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result);
    } catch (error) {
        logger.error('Error toggling favorite', { id: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

/**
 * POST /api/jobs/:id/sentcv
 * Toggle "Sent CV" status of a job.
 */
router.post('/:id/sentcv', async (req, res) => {
    try {
        const result = await filterService.toggleSentCV(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result);
    } catch (error) {
        logger.error('Error toggling sentCV', { id: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to toggle sent CV' });
    }
});

/**
 * POST /api/jobs/:id/hide
 * Hide a job from all future results.
 */
router.post('/:id/hide', async (req, res) => {
    try {
        const result = await filterService.hideJob(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result);
    } catch (error) {
        logger.error('Error hiding job', { id: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to hide job' });
    }
});

/**
 * GET /api/jobs/:id
 * Get a single job by ID with full details.
 */
router.get('/:id', async (req, res) => {
    try {
        const job = await filterService.getJobById(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        logger.error('Error fetching job', { id: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

module.exports = router;
