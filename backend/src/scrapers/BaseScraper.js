const Job = require('../models/Job');
const ScrapeLog = require('../models/ScrapeLog');
const logger = require('../utils/logger');
const { generateFingerprint, detectRegion, detectWorkMode, classifyCategory, classifyJobType, classifyExperienceLevel } = require('../utils/helpers');

/**
 * Abstract base class for all site scrapers.
 * Each site adapter extends this and implements scrape() and parseJobPage().
 */
class BaseScraper {
    constructor(siteName, baseUrl) {
        this.siteName = siteName;
        this.baseUrl = baseUrl;
        this.maxPages = 5; // Max pages to scrape per run
        this.delayBetweenPages = 2000; // ms between page requests
    }

    /**
     * Main entry point — override in subclasses.
     * Should return an array of normalized job objects.
     */
    async scrape(searchParams = {}) {
        throw new Error(`scrape() not implemented for ${this.siteName}`);
    }

    /**
     * Normalize a raw scraped job into the unified schema.
     * Subclasses can override for site-specific normalization.
     */
    normalizeJob(rawJob) {
        const region = detectRegion(rawJob.city || rawJob.location);
        const workMode = detectWorkMode(
            `${rawJob.title || ''} ${rawJob.description || ''} ${rawJob.location || ''}`
        );
        const fingerprint = generateFingerprint(rawJob.title, rawJob.company, rawJob.city);

        return {
            title: rawJob.title?.trim() || null,
            titleHe: rawJob.titleHe?.trim() || null,
            company: rawJob.company?.trim() || null,
            companyVerified: rawJob.companyVerified || false,
            location: rawJob.location?.trim() || null,
            city: rawJob.city?.trim() || null,
            region: region || rawJob.region || null,
            description: rawJob.description?.trim() || null,
            descriptionHe: rawJob.descriptionHe?.trim() || null,
            jobType: classifyJobType(rawJob.jobType) || rawJob.jobType || null,
            experienceLevel: classifyExperienceLevel(rawJob.experienceLevel) || rawJob.experienceLevel || null,
            salary: rawJob.salary?.trim() || null,
            salaryMin: rawJob.salaryMin || null,
            salaryMax: rawJob.salaryMax || null,
            category: classifyCategory(rawJob.category || rawJob.title),
            skills: rawJob.skills || [],
            url: rawJob.url,
            sourceUrl: rawJob.sourceUrl || rawJob.url,
            sourceSite: this.siteName,
            postedAt: rawJob.postedAt || null,
            isRemote: workMode.isRemote || rawJob.isRemote || false,
            isHybrid: workMode.isHybrid || rawJob.isHybrid || false,
            fingerprint,
        };
    }

    /**
     * Save a batch of normalized jobs to the database.
     * Uses findOne + update/create to avoid duplicate URL errors.
     */
    async saveJobs(jobs) {
        let saved = 0;
        let updated = 0;
        let errors = 0;

        for (const job of jobs) {
            try {
                if (!job.url || !job.title) {
                    errors++;
                    continue;
                }

                const existing = await Job.findOne({ url: job.url });

                if (existing) {
                    // Update with fresh data
                    await Job.updateOne(
                        { url: job.url },
                        { $set: { ...job, scrapedAt: new Date(), isActive: true } }
                    );
                    updated++;
                } else {
                    await Job.create({
                        ...job,
                        scrapedAt: new Date(),
                        isActive: true,
                    });
                    saved++;
                }
            } catch (error) {
                // MongoDB duplicate key error (race condition — another scraper saved it first)
                if (error.code === 11000) {
                    updated++;
                } else {
                    logger.error(`Error saving job from ${this.siteName}`, {
                        title: job.title,
                        error: error.message,
                    });
                    errors++;
                }
            }
        }

        logger.info(`${this.siteName}: Saved ${saved} new, updated ${updated}, errors ${errors}`);
        return { saved, updated, errors };
    }

    /**
     * Create a scrape log entry.
     */
    async logScrape(status, jobsFound, jobsNew, duration, error = null) {
        try {
            await ScrapeLog.create({
                site: this.siteName,
                status,
                jobsFound,
                jobsNew,
                duration,
                error: error?.substring(0, 1000),
            });
        } catch (err) {
            logger.error('Failed to write scrape log', { error: err.message });
        }
    }

    /**
     * Full scrape pipeline: scrape → normalize → deduplicate → save → log.
     */
    async run(searchParams = {}) {
        const startTime = Date.now();
        logger.info(`Starting scrape for ${this.siteName}...`);

        try {
            const rawJobs = await this.scrape(searchParams);
            const normalizedJobs = rawJobs
                .map(job => this.normalizeJob(job))
                .filter(job => job.url && job.title);

            logger.info(`${this.siteName}: Scraped ${normalizedJobs.length} jobs`);

            const { saved, updated, errors } = await this.saveJobs(normalizedJobs);
            const duration = Date.now() - startTime;

            await this.logScrape('success', normalizedJobs.length, saved, duration);

            return {
                site: this.siteName,
                status: 'success',
                jobsFound: normalizedJobs.length,
                jobsNew: saved,
                jobsUpdated: updated,
                errors,
                duration,
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Scrape failed for ${this.siteName}`, { error: error.message, stack: error.stack });
            await this.logScrape('failed', 0, 0, duration, error.message);

            return {
                site: this.siteName,
                status: 'failed',
                error: error.message,
                duration,
            };
        }
    }
}

module.exports = BaseScraper;
