const Job = require('../models/Job');
const logger = require('../utils/logger');

class FilterService {
    /**
     * Build a Mongoose query filter from API request parameters.
     * Supports full-text search, category, location, job type, experience,
     * source site, date range, employer filtering, and salary range.
     */
    buildQuery(params) {
        const filter = {
            isActive: true,
            duplicateOfId: null, // Only show canonical (non-duplicate) jobs
            hidden: { $ne: true },
        };

        // Text search (title, company, description)
        if (params.q) {
            const escaped = params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { title: { $regex: escaped, $options: 'i' } },
                { titleHe: { $regex: escaped, $options: 'i' } },
                { company: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } },
                { descriptionHe: { $regex: escaped, $options: 'i' } },
            ];
        }

        // Category filter
        if (params.category) {
            filter.category = params.category;
        }

        // Location filters
        if (params.city) {
            const escaped = params.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.city = { $regex: escaped, $options: 'i' };
        }
        if (params.region) {
            filter.region = params.region;
        }

        // Remote/hybrid filter
        if (params.remote === 'true') {
            filter.isRemote = true;
        }
        if (params.hybrid === 'true') {
            filter.isHybrid = true;
        }

        // Job type filter (can be comma-separated)
        if (params.jobType) {
            const types = params.jobType.split(',').map(t => t.trim());
            filter.jobType = { $in: types };
        }

        // Experience level filter
        if (params.experienceLevel) {
            const levels = params.experienceLevel.split(',').map(l => l.trim());
            filter.experienceLevel = { $in: levels };
        }

        // Source site filter (can be comma-separated)
        if (params.source) {
            const sources = params.source.split(',').map(s => s.trim());
            filter.sourceSite = { $in: sources };
        }

        // Date range (posted within N days)
        if (params.daysAgo) {
            const days = parseInt(params.daysAgo, 10);
            if (!isNaN(days) && days > 0) {
                const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                filter.postedAt = { $gte: cutoff };
            }
        }

        // Employer filter: hide unknown employers
        if (params.hideUnknownEmployer === 'true') {
            filter.company = { $ne: null };
            filter.$nor = [
                { company: '' },
                { company: { $in: ['לא צוין', 'N/A', 'Unknown', 'חסוי', 'confidential', 'Confidential'] } },
            ];
        }

        // Favorites filter
        if (params.favorites === 'true') {
            filter.isFavorite = true;
        }

        // Salary range filter
        if (params.salaryMin) {
            const min = parseInt(params.salaryMin, 10);
            if (!isNaN(min)) {
                filter.salaryMax = { $gte: min };
            }
        }
        if (params.salaryMax) {
            const max = parseInt(params.salaryMax, 10);
            if (!isNaN(max)) {
                filter.salaryMin = { $lte: max };
            }
        }

        return filter;
    }

    /**
     * Build a Mongoose sort object from sort parameter.
     */
    buildSort(sortBy) {
        switch (sortBy) {
            case 'date_desc':
                return { postedAt: -1 };
            case 'date_asc':
                return { postedAt: 1 };
            case 'company_asc':
                return { company: 1 };
            case 'company_desc':
                return { company: -1 };
            case 'salary_desc':
                return { salaryMax: -1 };
            case 'salary_asc':
                return { salaryMin: 1 };
            case 'relevance':
            default:
                return { scrapedAt: -1 };
        }
    }

    /**
     * Execute a filtered, sorted, paginated job query.
     */
    async queryJobs(params) {
        const filter = this.buildQuery(params);
        const sort = this.buildSort(params.sort);
        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const selectFields = 'title titleHe company companyVerified location city region jobType experienceLevel salary salaryMin salaryMax category skills url sourceUrl sourceSite postedAt scrapedAt isRemote isHybrid isFavorite';

        const [jobs, total] = await Promise.all([
            Job.find(filter).sort(sort).skip(skip).limit(limit).select(selectFields).lean(),
            Job.countDocuments(filter),
        ]);

        // Map _id to id for API compatibility
        const mappedJobs = jobs.map(job => {
            job.id = job._id.toString();
            delete job._id;
            delete job.__v;
            return job;
        });

        return {
            jobs: mappedJobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        };
    }

    /**
     * Get a single job by ID with full details.
     */
    async getJobById(id) {
        const job = await Job.findById(id).lean();
        if (!job) return null;
        job.id = job._id.toString();
        delete job._id;
        delete job.__v;
        return job;
    }

    /**
     * Get aggregated statistics for the dashboard.
     */
    async getStats() {
        const baseFilter = { isActive: true, duplicateOfId: null, hidden: { $ne: true } };

        const [total, bySource, byCategory, byRegion, byJobType, recent24h] = await Promise.all([
            Job.countDocuments(baseFilter),
            Job.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$sourceSite', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Job.aggregate([
                { $match: { ...baseFilter, category: { $ne: null } } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Job.aggregate([
                { $match: { ...baseFilter, region: { $ne: null } } },
                { $group: { _id: '$region', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Job.aggregate([
                { $match: { ...baseFilter, jobType: { $ne: null } } },
                { $group: { _id: '$jobType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Job.countDocuments({
                ...baseFilter,
                scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
        ]);

        return {
            total,
            recent24h,
            bySource: bySource.map(s => ({ source: s._id, count: s.count })),
            byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
            byRegion: byRegion.map(r => ({ region: r._id, count: r.count })),
            byJobType: byJobType.map(t => ({ jobType: t._id, count: t.count })),
        };
    }

    /**
     * Get available filter values (for populating dropdowns).
     */
    async getFilterOptions() {
        const baseFilter = { isActive: true, duplicateOfId: null, hidden: { $ne: true } };

        const [categories, cities, regions, sources, jobTypes, experienceLevels] = await Promise.all([
            Job.distinct('category', { ...baseFilter, category: { $ne: null } }),
            Job.distinct('city', { ...baseFilter, city: { $ne: null } }),
            Job.distinct('region', { ...baseFilter, region: { $ne: null } }),
            Job.distinct('sourceSite', baseFilter),
            Job.distinct('jobType', { ...baseFilter, jobType: { $ne: null } }),
            Job.distinct('experienceLevel', { ...baseFilter, experienceLevel: { $ne: null } }),
        ]);

        return {
            categories: categories.sort(),
            cities: cities.sort(),
            regions: regions.sort(),
            sources: sources.sort(),
            jobTypes: jobTypes.sort(),
            experienceLevels: experienceLevels.sort(),
        };
    }
    async toggleFavorite(id) {
        const job = await Job.findById(id);
        if (!job) return null;
        job.isFavorite = !job.isFavorite;
        await job.save();
        return { id: job._id.toString(), isFavorite: job.isFavorite };
    }

    async hideJob(id) {
        const job = await Job.findByIdAndUpdate(id, { hidden: true }, { new: true });
        if (!job) return null;
        return { id: job._id.toString(), hidden: true };
    }
}

module.exports = new FilterService();
