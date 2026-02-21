/**
 * Integration tests for all 18 scrapers.
 * These tests hit real websites to verify each scraper can connect and return results.
 *
 * Run with: npm run test:scrapers
 *
 * Note: These are integration tests — they depend on external sites being available.
 * Some scrapers may return 0 results if a site is down or blocks requests,
 * but they should NOT throw errors.
 */

// Puppeteer-based scrapers (require Chrome)
const AllJobsScraper = require('../sites/AllJobsScraper');
const DrushimScraper = require('../sites/DrushimScraper');
const JobMasterScraper = require('../sites/JobMasterScraper');
const LinkedInScraper = require('../sites/LinkedInScraper');
const GotFriendsScraper = require('../sites/GotFriendsScraper');
const SqLinkScraper = require('../sites/SqLinkScraper');
const EthosiaScraper = require('../sites/EthosiaScraper');
const TaasukaScraper = require('../sites/TaasukaScraper');
const TaasiyaScraper = require('../sites/TaasiyaScraper');
const JobKarovScraper = require('../sites/JobKarovScraper');
const XPlaceScraper = require('../sites/XPlaceScraper');
const GlassdoorScraper = require('../sites/GlassdoorScraper');

// Fetch-based scrapers (no Chrome needed)
const SecretTelAvivScraper = require('../sites/SecretTelAvivScraper');
const JangloScraper = require('../sites/JangloScraper');
const ShatilScraper = require('../sites/ShatilScraper');
const GovIlScraper = require('../sites/GovIlScraper');
const IndeedScraper = require('../sites/IndeedScraper');
const NbnScraper = require('../sites/NbnScraper');

// Check if puppeteer-core + a real Chrome executable are available
let puppeteerAvailable = false;
try {
    require('puppeteer-core');
    const fs = require('fs');
    const localPaths = [
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
    ].filter(Boolean);
    puppeteerAvailable = localPaths.some(p => fs.existsSync(p));
} catch {
    // puppeteer-core not available
}

const describeIfPuppeteer = puppeteerAvailable ? describe : describe.skip;

/**
 * Validate that a job object has the minimum required fields.
 */
function expectValidJob(job) {
    expect(job).toHaveProperty('title');
    expect(job).toHaveProperty('url');
    expect(typeof job.title).toBe('string');
    expect(job.title.length).toBeGreaterThan(0);
    expect(typeof job.url).toBe('string');
    expect(job.url).toMatch(/^https?:\/\//);
}

// ==========================================
// Fetch-based scrapers (no Chrome dependency)
// ==========================================
describe('Fetch-based scrapers', () => {
    // Limit to 1 page for faster tests
    beforeEach(function () {
        // Each scraper instance is fresh per test
    });

    describe('IndeedScraper (RSS)', () => {
        const scraper = new IndeedScraper();

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('indeed');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });

    describe('GovIlScraper (API + Cheerio fallback)', () => {
        const scraper = new GovIlScraper();

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('govil');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });

    describe('SecretTelAvivScraper (Cheerio)', () => {
        const scraper = new SecretTelAvivScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('secrettelaviv');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });

    describe('JangloScraper (Cheerio)', () => {
        const scraper = new JangloScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('janglo');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });

    describe('ShatilScraper (Cheerio)', () => {
        const scraper = new ShatilScraper();

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('shatil');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });

    describe('NbnScraper (Cheerio)', () => {
        const scraper = new NbnScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('nbn');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 30000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 30000);
    });
});

// ==========================================
// Puppeteer-based scrapers (require Chrome)
// ==========================================
describeIfPuppeteer('Puppeteer-based scrapers', () => {
    describe('AllJobsScraper', () => {
        const scraper = new AllJobsScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('alljobs');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('DrushimScraper', () => {
        const scraper = new DrushimScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('drushim');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('JobMasterScraper', () => {
        const scraper = new JobMasterScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('jobmaster');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('LinkedInScraper', () => {
        const scraper = new LinkedInScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('linkedin');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('GotFriendsScraper', () => {
        const scraper = new GotFriendsScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('gotfriends');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('SqLinkScraper', () => {
        const scraper = new SqLinkScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('sqlink');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('EthosiaScraper', () => {
        const scraper = new EthosiaScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('ethosia');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('TaasukaScraper', () => {
        const scraper = new TaasukaScraper();

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('taasuka');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('TaasiyaScraper', () => {
        const scraper = new TaasiyaScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('taasiya');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('JobKarovScraper', () => {
        const scraper = new JobKarovScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('jobkarov');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('XPlaceScraper', () => {
        const scraper = new XPlaceScraper();

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('xplace');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });

    describe('GlassdoorScraper', () => {
        const scraper = new GlassdoorScraper();
        scraper.maxPages = 1;

        test('instantiates with correct site name', () => {
            expect(scraper.siteName).toBe('glassdoor');
        });

        test('scrape() returns an array without throwing', async () => {
            const jobs = await scraper.scrape();
            expect(Array.isArray(jobs)).toBe(true);
        }, 60000);

        test('returned jobs have title and url', async () => {
            const jobs = await scraper.scrape();
            if (jobs.length > 0) {
                expectValidJob(jobs[0]);
            }
        }, 60000);
    });
});
