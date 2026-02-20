const Fuse = require('fuse.js');
const Job = require('../models/Job');
const { generateFingerprint, normalizeText } = require('../utils/helpers');
const logger = require('../utils/logger');

class DeduplicationService {
    constructor() {
        this.fuseOptions = {
            keys: ['title', 'company'],
            threshold: 0.15, // Lower = stricter matching (0.15 ≈ 85% similarity)
            includeScore: true,
        };
    }

    /**
     * Process a batch of scraped jobs and identify/remove duplicates.
     * Returns only unique jobs (or canonical versions of duplicates).
     */
    async deduplicateJobs(newJobs) {
        const results = { unique: [], duplicates: [], merged: 0 };

        for (const job of newJobs) {
            // Layer 1: Exact URL match
            const urlMatch = await Job.findOne({ url: job.url }).lean();
            if (urlMatch) {
                // Update existing record with fresh data
                await this.mergeJob(urlMatch, job);
                results.merged++;
                continue;
            }

            // Layer 2: Fingerprint match
            const fingerprint = generateFingerprint(job.title, job.company, job.city);
            job.fingerprint = fingerprint;

            const fpMatch = await Job.findOne({
                fingerprint,
                isActive: true,
                duplicateOfId: null,
            }).lean();
            if (fpMatch) {
                job.duplicateOfId = fpMatch._id;
                results.duplicates.push(job);
                logger.debug(`Duplicate (fingerprint): "${job.title}" from ${job.sourceSite} matches "${fpMatch.title}" from ${fpMatch.sourceSite}`);
                continue;
            }

            // Layer 3: Fuzzy matching against recent jobs in same city
            const isDuplicate = await this.fuzzyMatch(job);
            if (isDuplicate) {
                job.duplicateOfId = isDuplicate._id;
                results.duplicates.push(job);
                logger.debug(`Duplicate (fuzzy): "${job.title}" from ${job.sourceSite} matches "${isDuplicate.title}" from ${isDuplicate.sourceSite}`);
                continue;
            }

            results.unique.push(job);
        }

        logger.info(`Deduplication: ${results.unique.length} unique, ${results.duplicates.length} duplicates, ${results.merged} merged`);
        return results;
    }

    /**
     * Fuzzy match a job against existing jobs in the database.
     */
    async fuzzyMatch(job) {
        if (!job.title || !job.company) return null;

        // Fetch recent active jobs with same company (approximate match)
        const filter = {
            isActive: true,
            duplicateOfId: null,
            company: { $ne: null },
            ...(job.city ? { city: job.city } : {}),
        };

        const candidates = await Job.find(filter)
            .select('title company sourceSite')
            .limit(500)
            .lean();

        if (candidates.length === 0) return null;

        const fuse = new Fuse(candidates, this.fuseOptions);
        const searchStr = `${normalizeText(job.title)} ${normalizeText(job.company)}`;
        const matches = fuse.search(searchStr);

        if (matches.length > 0 && matches[0].score < 0.15) {
            return matches[0].item;
        }

        return null;
    }

    /**
     * Merge new job data into an existing job (keep the more complete record).
     */
    async mergeJob(existing, incoming) {
        const updates = {};

        // Fill in missing fields from the new scrape
        if (!existing.company && incoming.company) updates.company = incoming.company;
        if (!existing.salary && incoming.salary) updates.salary = incoming.salary;
        if (!existing.salaryMin && incoming.salaryMin) updates.salaryMin = incoming.salaryMin;
        if (!existing.salaryMax && incoming.salaryMax) updates.salaryMax = incoming.salaryMax;
        if (!existing.description && incoming.description) updates.description = incoming.description;
        if (!existing.category && incoming.category) updates.category = incoming.category;
        if (!existing.experienceLevel && incoming.experienceLevel) updates.experienceLevel = incoming.experienceLevel;
        if (!existing.jobType && incoming.jobType) updates.jobType = incoming.jobType;

        // Always update scrapedAt to mark it as still active
        updates.scrapedAt = new Date();
        updates.isActive = true;

        if (Object.keys(updates).length > 1) {
            await Job.updateOne({ _id: existing._id }, { $set: updates });
        }
    }

    /**
     * Mark jobs that haven't been seen in recent scrapes as inactive.
     */
    async markStaleJobs(sourceSite, hoursThreshold = 48) {
        const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

        const result = await Job.updateMany(
            {
                sourceSite,
                scrapedAt: { $lt: cutoff },
                isActive: true,
            },
            { $set: { isActive: false } }
        );

        if (result.modifiedCount > 0) {
            logger.info(`Marked ${result.modifiedCount} stale jobs from ${sourceSite} as inactive`);
        }
    }
}

module.exports = new DeduplicationService();
