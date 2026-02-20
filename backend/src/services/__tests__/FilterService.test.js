const filterService = require('../FilterService');

describe('FilterService', () => {
    // =============================================
    // buildQuery() — base filter
    // =============================================
    describe('buildQuery()', () => {
        test('returns base filter for empty params', () => {
            const filter = filterService.buildQuery({});
            expect(filter).toEqual({
                isActive: true,
                duplicateOfId: null,
                hidden: { $ne: true },
            });
        });

        // =============================================
        // Text search (q)
        // =============================================
        describe('text search (q)', () => {
            test('creates $or with regex across all text fields', () => {
                const filter = filterService.buildQuery({ q: 'developer' });
                expect(filter.$or).toBeDefined();
                expect(filter.$or).toHaveLength(5);
                expect(filter.$or[0]).toEqual({ title: { $regex: 'developer', $options: 'i' } });
                expect(filter.$or[1]).toEqual({ titleHe: { $regex: 'developer', $options: 'i' } });
                expect(filter.$or[2]).toEqual({ company: { $regex: 'developer', $options: 'i' } });
                expect(filter.$or[3]).toEqual({ description: { $regex: 'developer', $options: 'i' } });
                expect(filter.$or[4]).toEqual({ descriptionHe: { $regex: 'developer', $options: 'i' } });
            });

            test('escapes special regex characters in search query', () => {
                const filter = filterService.buildQuery({ q: 'c++ (senior)' });
                expect(filter.$or[0].title.$regex).toBe('c\\+\\+ \\(senior\\)');
            });

            test('handles Hebrew search queries', () => {
                const filter = filterService.buildQuery({ q: 'מפתח' });
                expect(filter.$or[0].title.$regex).toBe('מפתח');
            });

            test('does not set $or when q is empty string', () => {
                const filter = filterService.buildQuery({ q: '' });
                expect(filter.$or).toBeUndefined();
            });
        });

        // =============================================
        // Category filter
        // =============================================
        describe('category filter', () => {
            test('sets exact category match', () => {
                const filter = filterService.buildQuery({ category: 'SOFTWARE' });
                expect(filter.category).toBe('SOFTWARE');
            });

            test('does not set category for empty string', () => {
                const filter = filterService.buildQuery({ category: '' });
                expect(filter.category).toBeUndefined();
            });
        });

        // =============================================
        // Location filters (city, region)
        // =============================================
        describe('location filters', () => {
            test('creates case-insensitive regex for city', () => {
                const filter = filterService.buildQuery({ city: 'תל אביב' });
                expect(filter.city).toEqual({ $regex: 'תל אביב', $options: 'i' });
            });

            test('escapes special characters in city name', () => {
                const filter = filterService.buildQuery({ city: 'tel aviv (north)' });
                expect(filter.city.$regex).toBe('tel aviv \\(north\\)');
            });

            test('sets exact region match', () => {
                const filter = filterService.buildQuery({ region: 'CENTER' });
                expect(filter.region).toBe('CENTER');
            });

            test('does not set city for empty string', () => {
                const filter = filterService.buildQuery({ city: '' });
                expect(filter.city).toBeUndefined();
            });
        });

        // =============================================
        // Remote / Hybrid
        // =============================================
        describe('remote and hybrid filters', () => {
            test('sets isRemote when remote is "true"', () => {
                const filter = filterService.buildQuery({ remote: 'true' });
                expect(filter.isRemote).toBe(true);
            });

            test('does not set isRemote for other values', () => {
                expect(filterService.buildQuery({ remote: '' }).isRemote).toBeUndefined();
                expect(filterService.buildQuery({ remote: 'false' }).isRemote).toBeUndefined();
                expect(filterService.buildQuery({}).isRemote).toBeUndefined();
            });

            test('sets isHybrid when hybrid is "true"', () => {
                const filter = filterService.buildQuery({ hybrid: 'true' });
                expect(filter.isHybrid).toBe(true);
            });

            test('does not set isHybrid for other values', () => {
                expect(filterService.buildQuery({ hybrid: '' }).isHybrid).toBeUndefined();
                expect(filterService.buildQuery({ hybrid: 'false' }).isHybrid).toBeUndefined();
            });
        });

        // =============================================
        // Job type (multi-select, comma-separated)
        // =============================================
        describe('jobType filter', () => {
            test('creates $in for single job type', () => {
                const filter = filterService.buildQuery({ jobType: 'FULL_TIME' });
                expect(filter.jobType).toEqual({ $in: ['FULL_TIME'] });
            });

            test('creates $in for multiple job types', () => {
                const filter = filterService.buildQuery({ jobType: 'FULL_TIME,PART_TIME' });
                expect(filter.jobType).toEqual({ $in: ['FULL_TIME', 'PART_TIME'] });
            });

            test('trims whitespace in comma-separated values', () => {
                const filter = filterService.buildQuery({ jobType: 'FULL_TIME , PART_TIME' });
                expect(filter.jobType).toEqual({ $in: ['FULL_TIME', 'PART_TIME'] });
            });

            test('does not set jobType for empty string', () => {
                const filter = filterService.buildQuery({ jobType: '' });
                expect(filter.jobType).toBeUndefined();
            });
        });

        // =============================================
        // Experience level (multi-select, comma-separated)
        // =============================================
        describe('experienceLevel filter', () => {
            test('creates $in for single level', () => {
                const filter = filterService.buildQuery({ experienceLevel: 'SENIOR' });
                expect(filter.experienceLevel).toEqual({ $in: ['SENIOR'] });
            });

            test('creates $in for multiple levels', () => {
                const filter = filterService.buildQuery({ experienceLevel: 'JUNIOR,MID,SENIOR' });
                expect(filter.experienceLevel).toEqual({ $in: ['JUNIOR', 'MID', 'SENIOR'] });
            });

            test('does not set experienceLevel for empty string', () => {
                const filter = filterService.buildQuery({ experienceLevel: '' });
                expect(filter.experienceLevel).toBeUndefined();
            });
        });

        // =============================================
        // Source site (multi-select, comma-separated)
        // =============================================
        describe('source site filter', () => {
            test('creates $in for sourceSite with single value', () => {
                const filter = filterService.buildQuery({ source: 'linkedin' });
                expect(filter.sourceSite).toEqual({ $in: ['linkedin'] });
            });

            test('creates $in for multiple sources', () => {
                const filter = filterService.buildQuery({ source: 'linkedin,indeed,alljobs' });
                expect(filter.sourceSite).toEqual({ $in: ['linkedin', 'indeed', 'alljobs'] });
            });

            test('does not set sourceSite for empty string', () => {
                const filter = filterService.buildQuery({ source: '' });
                expect(filter.sourceSite).toBeUndefined();
            });
        });

        // =============================================
        // Date range (daysAgo)
        // =============================================
        describe('daysAgo filter', () => {
            test('creates $gte filter for postedAt', () => {
                const now = Date.now();
                jest.spyOn(Date, 'now').mockReturnValue(now);

                const filter = filterService.buildQuery({ daysAgo: '7' });
                const expectedCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
                expect(filter.postedAt).toEqual({ $gte: expectedCutoff });

                Date.now.mockRestore();
            });

            test('handles daysAgo = 1 (24 hours)', () => {
                const now = Date.now();
                jest.spyOn(Date, 'now').mockReturnValue(now);

                const filter = filterService.buildQuery({ daysAgo: '1' });
                const expectedCutoff = new Date(now - 1 * 24 * 60 * 60 * 1000);
                expect(filter.postedAt).toEqual({ $gte: expectedCutoff });

                Date.now.mockRestore();
            });

            test('ignores non-numeric daysAgo', () => {
                const filter = filterService.buildQuery({ daysAgo: 'abc' });
                expect(filter.postedAt).toBeUndefined();
            });

            test('ignores negative daysAgo', () => {
                const filter = filterService.buildQuery({ daysAgo: '-5' });
                expect(filter.postedAt).toBeUndefined();
            });

            test('ignores zero daysAgo', () => {
                const filter = filterService.buildQuery({ daysAgo: '0' });
                expect(filter.postedAt).toBeUndefined();
            });

            test('does not set postedAt for empty string', () => {
                const filter = filterService.buildQuery({ daysAgo: '' });
                expect(filter.postedAt).toBeUndefined();
            });
        });

        // =============================================
        // Hide unknown employer
        // =============================================
        describe('hideUnknownEmployer filter', () => {
            test('filters out null and placeholder companies', () => {
                const filter = filterService.buildQuery({ hideUnknownEmployer: 'true' });
                expect(filter.company).toEqual({ $ne: null });
                expect(filter.$nor).toEqual([
                    { company: '' },
                    { company: { $in: ['לא צוין', 'N/A', 'Unknown', 'חסוי', 'confidential', 'Confidential'] } },
                ]);
            });

            test('does not set company filter for empty value', () => {
                const filter = filterService.buildQuery({ hideUnknownEmployer: '' });
                expect(filter.company).toBeUndefined();
                expect(filter.$nor).toBeUndefined();
            });

            test('does not set company filter for "false"', () => {
                const filter = filterService.buildQuery({ hideUnknownEmployer: 'false' });
                expect(filter.company).toBeUndefined();
                expect(filter.$nor).toBeUndefined();
            });
        });

        // =============================================
        // Favorites
        // =============================================
        describe('favorites filter', () => {
            test('sets isFavorite when favorites is "true"', () => {
                const filter = filterService.buildQuery({ favorites: 'true' });
                expect(filter.isFavorite).toBe(true);
            });

            test('does not set isFavorite for empty value', () => {
                const filter = filterService.buildQuery({ favorites: '' });
                expect(filter.isFavorite).toBeUndefined();
            });
        });

        // =============================================
        // Salary range
        // =============================================
        describe('salary range filter', () => {
            test('creates $gte on salaryMax when salaryMin is set', () => {
                const filter = filterService.buildQuery({ salaryMin: '10000' });
                expect(filter.salaryMax).toEqual({ $gte: 10000 });
            });

            test('creates $lte on salaryMin when salaryMax is set', () => {
                const filter = filterService.buildQuery({ salaryMax: '30000' });
                expect(filter.salaryMin).toEqual({ $lte: 30000 });
            });

            test('creates both salary bounds together', () => {
                const filter = filterService.buildQuery({ salaryMin: '10000', salaryMax: '30000' });
                expect(filter.salaryMax).toEqual({ $gte: 10000 });
                expect(filter.salaryMin).toEqual({ $lte: 30000 });
            });

            test('ignores non-numeric salaryMin', () => {
                const filter = filterService.buildQuery({ salaryMin: 'abc' });
                expect(filter.salaryMax).toBeUndefined();
            });

            test('ignores non-numeric salaryMax', () => {
                const filter = filterService.buildQuery({ salaryMax: 'abc' });
                expect(filter.salaryMin).toBeUndefined();
            });

            test('does not set salary filters for empty strings', () => {
                const filter = filterService.buildQuery({ salaryMin: '', salaryMax: '' });
                expect(filter.salaryMax).toBeUndefined();
                expect(filter.salaryMin).toBeUndefined();
            });
        });

        // =============================================
        // Combined filters
        // =============================================
        describe('combined filters', () => {
            test('text search + hideUnknownEmployer both work together', () => {
                const filter = filterService.buildQuery({
                    q: 'developer',
                    hideUnknownEmployer: 'true',
                });
                // Both $or (text search) and $nor (employer) should coexist
                expect(filter.$or).toBeDefined();
                expect(filter.$or).toHaveLength(5);
                expect(filter.$nor).toBeDefined();
                expect(filter.company).toEqual({ $ne: null });
            });

            test('all filters at once produce correct filter object', () => {
                const filter = filterService.buildQuery({
                    q: 'node',
                    category: 'SOFTWARE',
                    city: 'תל אביב',
                    region: 'TEL_AVIV',
                    remote: 'true',
                    hybrid: 'true',
                    jobType: 'FULL_TIME,PART_TIME',
                    experienceLevel: 'SENIOR',
                    source: 'linkedin,indeed',
                    daysAgo: '7',
                    hideUnknownEmployer: 'true',
                    favorites: 'true',
                    salaryMin: '15000',
                    salaryMax: '50000',
                });

                // Base
                expect(filter.isActive).toBe(true);
                expect(filter.duplicateOfId).toBeNull();
                expect(filter.hidden).toEqual({ $ne: true });

                // Text search
                expect(filter.$or).toHaveLength(5);

                // Category
                expect(filter.category).toBe('SOFTWARE');

                // Location
                expect(filter.city).toEqual({ $regex: 'תל אביב', $options: 'i' });
                expect(filter.region).toBe('TEL_AVIV');

                // Work style
                expect(filter.isRemote).toBe(true);
                expect(filter.isHybrid).toBe(true);

                // Multi-select
                expect(filter.jobType).toEqual({ $in: ['FULL_TIME', 'PART_TIME'] });
                expect(filter.experienceLevel).toEqual({ $in: ['SENIOR'] });
                expect(filter.sourceSite).toEqual({ $in: ['linkedin', 'indeed'] });

                // Date
                expect(filter.postedAt).toBeDefined();
                expect(filter.postedAt.$gte).toBeInstanceOf(Date);

                // Employer
                expect(filter.company).toEqual({ $ne: null });
                expect(filter.$nor).toBeDefined();

                // Favorites
                expect(filter.isFavorite).toBe(true);

                // Salary — NOTE: salaryMin/salaryMax field names are swapped intentionally
                // When user sets min salary, we filter jobs whose salaryMax >= that min
                // When user sets max salary, we filter jobs whose salaryMin <= that max
                expect(filter.salaryMax).toEqual({ $gte: 15000 });
                expect(filter.salaryMin).toEqual({ $lte: 50000 });
            });
        });
    });

    // =============================================
    // buildSort()
    // =============================================
    describe('buildSort()', () => {
        test('date_desc sorts by postedAt descending', () => {
            expect(filterService.buildSort('date_desc')).toEqual({ postedAt: -1 });
        });

        test('date_asc sorts by postedAt ascending', () => {
            expect(filterService.buildSort('date_asc')).toEqual({ postedAt: 1 });
        });

        test('company_asc sorts by company ascending', () => {
            expect(filterService.buildSort('company_asc')).toEqual({ company: 1 });
        });

        test('company_desc sorts by company descending', () => {
            expect(filterService.buildSort('company_desc')).toEqual({ company: -1 });
        });

        test('salary_desc sorts by salaryMax descending', () => {
            expect(filterService.buildSort('salary_desc')).toEqual({ salaryMax: -1 });
        });

        test('salary_asc sorts by salaryMin ascending', () => {
            expect(filterService.buildSort('salary_asc')).toEqual({ salaryMin: 1 });
        });

        test('relevance sorts by scrapedAt descending', () => {
            expect(filterService.buildSort('relevance')).toEqual({ scrapedAt: -1 });
        });

        test('unknown sort defaults to scrapedAt descending', () => {
            expect(filterService.buildSort('unknown')).toEqual({ scrapedAt: -1 });
            expect(filterService.buildSort(undefined)).toEqual({ scrapedAt: -1 });
            expect(filterService.buildSort('')).toEqual({ scrapedAt: -1 });
        });
    });
});
