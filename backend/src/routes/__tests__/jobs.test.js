require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const Job = require('../../models/Job');
const jobRoutes = require('../jobs');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);

// Test data factory
function createJob(overrides = {}) {
    return {
        title: 'Software Developer',
        titleHe: 'מפתח תוכנה',
        company: 'TestCorp',
        companyVerified: false,
        location: 'Tel Aviv',
        city: 'תל אביב',
        region: 'TEL_AVIV',
        description: 'Build great software',
        descriptionHe: 'בניית תוכנה מעולה',
        jobType: 'FULL_TIME',
        experienceLevel: 'MID',
        salary: '25,000',
        salaryMin: 20000,
        salaryMax: 30000,
        category: 'SOFTWARE',
        skills: ['JavaScript', 'React'],
        url: `https://example.com/job-${Math.random().toString(36).slice(2)}`,
        sourceUrl: 'https://example.com',
        sourceSite: 'linkedin',
        postedAt: new Date(),
        scrapedAt: new Date(),
        isActive: true,
        isRemote: false,
        isHybrid: false,
        duplicateOfId: null,
        hidden: false,
        isFavorite: false,
        ...overrides,
    };
}

beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/jobfinder-test';
    await mongoose.connect(dbUrl);
});

afterAll(async () => {
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Job.deleteMany({});
});

describe('GET /api/jobs', () => {
    // =============================================
    // Basic listing
    // =============================================
    test('returns empty list when no jobs exist', async () => {
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.jobs).toEqual([]);
        expect(res.body.pagination.total).toBe(0);
    });

    test('returns active non-duplicate jobs', async () => {
        await Job.create([
            createJob({ title: 'Job A' }),
            createJob({ title: 'Job B' }),
        ]);
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.jobs).toHaveLength(2);
    });

    test('excludes inactive jobs', async () => {
        await Job.create([
            createJob({ title: 'Active Job' }),
            createJob({ title: 'Inactive Job', isActive: false }),
        ]);
        const res = await request(app).get('/api/jobs');
        expect(res.body.jobs).toHaveLength(1);
        expect(res.body.jobs[0].title).toBe('Active Job');
    });

    test('excludes hidden jobs', async () => {
        await Job.create([
            createJob({ title: 'Visible Job' }),
            createJob({ title: 'Hidden Job', hidden: true }),
        ]);
        const res = await request(app).get('/api/jobs');
        expect(res.body.jobs).toHaveLength(1);
        expect(res.body.jobs[0].title).toBe('Visible Job');
    });

    test('excludes duplicate jobs', async () => {
        const original = await Job.create(createJob({ title: 'Original' }));
        await Job.create(createJob({ title: 'Duplicate', duplicateOfId: original._id }));
        const res = await request(app).get('/api/jobs');
        expect(res.body.jobs).toHaveLength(1);
        expect(res.body.jobs[0].title).toBe('Original');
    });

    // =============================================
    // Text search (q)
    // =============================================
    describe('text search (q)', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'React Developer', company: 'Google', description: 'Build UIs' }),
                createJob({ title: 'Backend Engineer', company: 'Facebook', description: 'Build APIs with Node' }),
                createJob({ title: 'QA Tester', company: 'NodeCorp', description: 'Test software' }),
            ]);
        });

        test('searches in title', async () => {
            const res = await request(app).get('/api/jobs?q=React');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('React Developer');
        });

        test('searches in company', async () => {
            const res = await request(app).get('/api/jobs?q=Google');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].company).toBe('Google');
        });

        test('searches in description', async () => {
            const res = await request(app).get('/api/jobs?q=Node');
            expect(res.body.jobs).toHaveLength(2); // Backend Engineer (desc) + QA Tester (company: NodeCorp)
        });

        test('search is case-insensitive', async () => {
            const res = await request(app).get('/api/jobs?q=react');
            expect(res.body.jobs).toHaveLength(1);
        });

        test('searches in Hebrew title', async () => {
            await Job.deleteMany({});
            await Job.create([
                createJob({ titleHe: 'מפתח פייתון', title: 'Python Dev' }),
                createJob({ titleHe: 'מהנדס תוכנה', title: 'SW Engineer' }),
            ]);
            const res = await request(app).get('/api/jobs?q=פייתון');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].titleHe).toBe('מפתח פייתון');
        });

        test('empty q returns all jobs', async () => {
            const res = await request(app).get('/api/jobs?q=');
            expect(res.body.jobs).toHaveLength(3);
        });
    });

    // =============================================
    // Category filter
    // =============================================
    describe('category filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ category: 'SOFTWARE' }),
                createJob({ category: 'DATA' }),
                createJob({ category: 'SOFTWARE' }),
            ]);
        });

        test('filters by exact category match', async () => {
            const res = await request(app).get('/api/jobs?category=SOFTWARE');
            expect(res.body.jobs).toHaveLength(2);
            res.body.jobs.forEach(j => expect(j.category).toBe('SOFTWARE'));
        });

        test('returns empty for non-existent category', async () => {
            const res = await request(app).get('/api/jobs?category=NONEXISTENT');
            expect(res.body.jobs).toHaveLength(0);
        });
    });

    // =============================================
    // City filter
    // =============================================
    describe('city filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ city: 'תל אביב' }),
                createJob({ city: 'חיפה' }),
                createJob({ city: 'תל אביב - יפו' }),
            ]);
        });

        test('filters by city with regex (partial match)', async () => {
            const res = await request(app).get('/api/jobs?city=תל אביב');
            expect(res.body.jobs).toHaveLength(2); // Both תל אביב and תל אביב - יפו
        });

        test('city search is case-insensitive', async () => {
            await Job.deleteMany({});
            await Job.create([
                createJob({ city: 'Tel Aviv' }),
                createJob({ city: 'Haifa' }),
            ]);
            const res = await request(app).get('/api/jobs?city=tel aviv');
            expect(res.body.jobs).toHaveLength(1);
        });
    });

    // =============================================
    // Remote filter
    // =============================================
    describe('remote filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Remote Job', isRemote: true }),
                createJob({ title: 'Office Job', isRemote: false }),
            ]);
        });

        test('filters only remote jobs when remote=true', async () => {
            const res = await request(app).get('/api/jobs?remote=true');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Remote Job');
        });

        test('returns all jobs when remote is not set', async () => {
            const res = await request(app).get('/api/jobs');
            expect(res.body.jobs).toHaveLength(2);
        });
    });

    // =============================================
    // Hybrid filter
    // =============================================
    describe('hybrid filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Hybrid Job', isHybrid: true }),
                createJob({ title: 'Office Job', isHybrid: false }),
            ]);
        });

        test('filters only hybrid jobs when hybrid=true', async () => {
            const res = await request(app).get('/api/jobs?hybrid=true');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Hybrid Job');
        });
    });

    // =============================================
    // Job type filter (multi-select)
    // =============================================
    describe('jobType filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ jobType: 'FULL_TIME' }),
                createJob({ jobType: 'PART_TIME' }),
                createJob({ jobType: 'CONTRACT' }),
            ]);
        });

        test('filters by single job type', async () => {
            const res = await request(app).get('/api/jobs?jobType=FULL_TIME');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].jobType).toBe('FULL_TIME');
        });

        test('filters by multiple job types (comma-separated)', async () => {
            const res = await request(app).get('/api/jobs?jobType=FULL_TIME,PART_TIME');
            expect(res.body.jobs).toHaveLength(2);
            const types = res.body.jobs.map(j => j.jobType).sort();
            expect(types).toEqual(['FULL_TIME', 'PART_TIME']);
        });
    });

    // =============================================
    // Experience level filter (multi-select)
    // =============================================
    describe('experienceLevel filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ experienceLevel: 'JUNIOR' }),
                createJob({ experienceLevel: 'MID' }),
                createJob({ experienceLevel: 'SENIOR' }),
            ]);
        });

        test('filters by single experience level', async () => {
            const res = await request(app).get('/api/jobs?experienceLevel=SENIOR');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].experienceLevel).toBe('SENIOR');
        });

        test('filters by multiple experience levels', async () => {
            const res = await request(app).get('/api/jobs?experienceLevel=JUNIOR,MID');
            expect(res.body.jobs).toHaveLength(2);
        });
    });

    // =============================================
    // Source filter (multi-select)
    // =============================================
    describe('source filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ sourceSite: 'linkedin' }),
                createJob({ sourceSite: 'indeed' }),
                createJob({ sourceSite: 'alljobs' }),
            ]);
        });

        test('filters by single source', async () => {
            const res = await request(app).get('/api/jobs?source=linkedin');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].sourceSite).toBe('linkedin');
        });

        test('filters by multiple sources', async () => {
            const res = await request(app).get('/api/jobs?source=linkedin,indeed');
            expect(res.body.jobs).toHaveLength(2);
        });
    });

    // =============================================
    // Date filter (daysAgo)
    // =============================================
    describe('daysAgo filter', () => {
        beforeEach(async () => {
            const now = new Date();
            const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
            const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

            await Job.create([
                createJob({ title: 'Recent Job', postedAt: now }),
                createJob({ title: 'Two Day Old Job', postedAt: twoDaysAgo }),
                createJob({ title: 'Old Job', postedAt: tenDaysAgo }),
            ]);
        });

        test('daysAgo=1 returns only jobs from last 24 hours', async () => {
            const res = await request(app).get('/api/jobs?daysAgo=1');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Recent Job');
        });

        test('daysAgo=7 returns jobs from last week', async () => {
            const res = await request(app).get('/api/jobs?daysAgo=7');
            expect(res.body.jobs).toHaveLength(2);
        });

        test('daysAgo=30 returns all recent jobs', async () => {
            const res = await request(app).get('/api/jobs?daysAgo=30');
            expect(res.body.jobs).toHaveLength(3);
        });
    });

    // =============================================
    // Hide unknown employer
    // =============================================
    describe('hideUnknownEmployer filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Known Co', company: 'Google' }),
                createJob({ title: 'Null Co', company: null }),
                createJob({ title: 'Empty Co', company: '' }),
                createJob({ title: 'NA Co', company: 'N/A' }),
                createJob({ title: 'Unknown Co', company: 'Unknown' }),
                createJob({ title: 'Hidden Co', company: 'חסוי' }),
                createJob({ title: 'Not Specified', company: 'לא צוין' }),
            ]);
        });

        test('filters out all placeholder companies', async () => {
            const res = await request(app).get('/api/jobs?hideUnknownEmployer=true');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Known Co');
        });

        test('returns all when filter is not set', async () => {
            const res = await request(app).get('/api/jobs');
            expect(res.body.jobs).toHaveLength(7);
        });
    });

    // =============================================
    // Favorites filter
    // =============================================
    describe('favorites filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Fav Job', isFavorite: true }),
                createJob({ title: 'Not Fav Job', isFavorite: false }),
            ]);
        });

        test('returns only favorites when favorites=true', async () => {
            const res = await request(app).get('/api/jobs?favorites=true');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Fav Job');
        });

        test('returns all when favorites is not set', async () => {
            const res = await request(app).get('/api/jobs');
            expect(res.body.jobs).toHaveLength(2);
        });
    });

    // =============================================
    // Salary range filter
    // =============================================
    describe('salary range filter', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Low Pay', salaryMin: 8000, salaryMax: 12000 }),
                createJob({ title: 'Mid Pay', salaryMin: 15000, salaryMax: 25000 }),
                createJob({ title: 'High Pay', salaryMin: 30000, salaryMax: 50000 }),
                createJob({ title: 'No Salary', salaryMin: null, salaryMax: null }),
            ]);
        });

        test('salaryMin filters jobs whose max >= the specified min', async () => {
            const res = await request(app).get('/api/jobs?salaryMin=20000');
            // Mid Pay (max 25000 >= 20000) and High Pay (max 50000 >= 20000)
            expect(res.body.jobs).toHaveLength(2);
            const titles = res.body.jobs.map(j => j.title).sort();
            expect(titles).toEqual(['High Pay', 'Mid Pay']);
        });

        test('salaryMax filters jobs whose min <= the specified max', async () => {
            const res = await request(app).get('/api/jobs?salaryMax=16000');
            // Low Pay (min 8000 <= 16000) and Mid Pay (min 15000 <= 16000)
            expect(res.body.jobs).toHaveLength(2);
            const titles = res.body.jobs.map(j => j.title).sort();
            expect(titles).toEqual(['Low Pay', 'Mid Pay']);
        });

        test('both salary bounds together find overlapping ranges', async () => {
            const res = await request(app).get('/api/jobs?salaryMin=13000&salaryMax=20000');
            // Mid Pay: salaryMax(25000) >= 13000 AND salaryMin(15000) <= 20000 ✓
            // Low Pay: salaryMax(12000) >= 13000? NO
            // High Pay: salaryMin(30000) <= 20000? NO
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Mid Pay');
        });

        test('salary filter excludes jobs with null salary', async () => {
            const res = await request(app).get('/api/jobs?salaryMin=1');
            // No Salary job has null salaryMax, so null >= 1 = false → excluded
            expect(res.body.jobs.every(j => j.title !== 'No Salary')).toBe(true);
        });
    });

    // =============================================
    // Pagination
    // =============================================
    describe('pagination', () => {
        beforeEach(async () => {
            const jobs = Array.from({ length: 25 }, (_, i) =>
                createJob({ title: `Job ${String(i).padStart(2, '0')}` })
            );
            await Job.create(jobs);
        });

        test('defaults to page 1, limit 20', async () => {
            const res = await request(app).get('/api/jobs');
            expect(res.body.jobs).toHaveLength(20);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.total).toBe(25);
            expect(res.body.pagination.totalPages).toBe(2);
            expect(res.body.pagination.hasMore).toBe(true);
        });

        test('page 2 returns remaining items', async () => {
            const res = await request(app).get('/api/jobs?page=2');
            expect(res.body.jobs).toHaveLength(5);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.hasMore).toBe(false);
        });

        test('custom limit works', async () => {
            const res = await request(app).get('/api/jobs?limit=5');
            expect(res.body.jobs).toHaveLength(5);
            expect(res.body.pagination.totalPages).toBe(5);
        });

        test('limit is capped at 100', async () => {
            const res = await request(app).get('/api/jobs?limit=200');
            expect(res.body.pagination.limit).toBe(100);
        });
    });

    // =============================================
    // Sorting
    // =============================================
    describe('sorting', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'A Job', company: 'Zebra', postedAt: new Date('2025-01-01'), salaryMin: 10000, salaryMax: 20000 }),
                createJob({ title: 'B Job', company: 'Apple', postedAt: new Date('2025-06-01'), salaryMin: 30000, salaryMax: 40000 }),
                createJob({ title: 'C Job', company: 'Meta', postedAt: new Date('2025-03-01'), salaryMin: 5000, salaryMax: 8000 }),
            ]);
        });

        test('date_desc sorts newest first', async () => {
            const res = await request(app).get('/api/jobs?sort=date_desc');
            expect(res.body.jobs[0].title).toBe('B Job');
            expect(res.body.jobs[2].title).toBe('A Job');
        });

        test('date_asc sorts oldest first', async () => {
            const res = await request(app).get('/api/jobs?sort=date_asc');
            expect(res.body.jobs[0].title).toBe('A Job');
            expect(res.body.jobs[2].title).toBe('B Job');
        });

        test('company_asc sorts alphabetically', async () => {
            const res = await request(app).get('/api/jobs?sort=company_asc');
            expect(res.body.jobs[0].company).toBe('Apple');
            expect(res.body.jobs[2].company).toBe('Zebra');
        });

        test('salary_desc sorts highest salary first', async () => {
            const res = await request(app).get('/api/jobs?sort=salary_desc');
            expect(res.body.jobs[0].title).toBe('B Job');
            expect(res.body.jobs[2].title).toBe('C Job');
        });
    });

    // =============================================
    // Combined filters
    // =============================================
    describe('combined filters', () => {
        beforeEach(async () => {
            await Job.create([
                createJob({ title: 'Remote SW Dev', category: 'SOFTWARE', isRemote: true, jobType: 'FULL_TIME', sourceSite: 'linkedin' }),
                createJob({ title: 'Office SW Dev', category: 'SOFTWARE', isRemote: false, jobType: 'FULL_TIME', sourceSite: 'indeed' }),
                createJob({ title: 'Remote QA', category: 'QA', isRemote: true, jobType: 'PART_TIME', sourceSite: 'linkedin' }),
                createJob({ title: 'Office Data', category: 'DATA', isRemote: false, jobType: 'CONTRACT', sourceSite: 'alljobs' }),
            ]);
        });

        test('category + remote narrows results', async () => {
            const res = await request(app).get('/api/jobs?category=SOFTWARE&remote=true');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Remote SW Dev');
        });

        test('jobType + source narrows results', async () => {
            const res = await request(app).get('/api/jobs?jobType=FULL_TIME&source=linkedin');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Remote SW Dev');
        });

        test('text search + category', async () => {
            const res = await request(app).get('/api/jobs?q=Remote&category=QA');
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Remote QA');
        });
    });
});

// =============================================
// POST /api/jobs/:id/favorite
// =============================================
describe('POST /api/jobs/:id/favorite', () => {
    test('toggles favorite on', async () => {
        const job = await Job.create(createJob({ isFavorite: false }));
        const res = await request(app).post(`/api/jobs/${job._id}/favorite`);
        expect(res.status).toBe(200);
        expect(res.body.isFavorite).toBe(true);
    });

    test('toggles favorite off', async () => {
        const job = await Job.create(createJob({ isFavorite: true }));
        const res = await request(app).post(`/api/jobs/${job._id}/favorite`);
        expect(res.status).toBe(200);
        expect(res.body.isFavorite).toBe(false);
    });

    test('returns 404 for non-existent job', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post(`/api/jobs/${fakeId}/favorite`);
        expect(res.status).toBe(404);
    });
});

// =============================================
// POST /api/jobs/:id/hide
// =============================================
describe('POST /api/jobs/:id/hide', () => {
    test('hides a job', async () => {
        const job = await Job.create(createJob());
        const res = await request(app).post(`/api/jobs/${job._id}/hide`);
        expect(res.status).toBe(200);
        expect(res.body.hidden).toBe(true);
    });

    test('hidden job no longer appears in listing', async () => {
        const job = await Job.create(createJob({ title: 'Soon Hidden' }));

        // Verify it appears first
        let res = await request(app).get('/api/jobs');
        expect(res.body.jobs).toHaveLength(1);

        // Hide it
        await request(app).post(`/api/jobs/${job._id}/hide`);

        // Verify it's gone
        res = await request(app).get('/api/jobs');
        expect(res.body.jobs).toHaveLength(0);
    });

    test('returns 404 for non-existent job', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post(`/api/jobs/${fakeId}/hide`);
        expect(res.status).toBe(404);
    });
});

// =============================================
// GET /api/jobs/:id
// =============================================
describe('GET /api/jobs/:id', () => {
    test('returns full job details including description', async () => {
        const job = await Job.create(createJob({
            description: 'Full description here',
            descriptionHe: 'תיאור מלא כאן',
        }));
        const res = await request(app).get(`/api/jobs/${job._id}`);
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Full description here');
        expect(res.body.descriptionHe).toBe('תיאור מלא כאן');
        expect(res.body.id).toBeDefined();
    });

    test('returns 404 for non-existent job', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/jobs/${fakeId}`);
        expect(res.status).toBe(404);
    });
});
