const logger = require('./logger');
const fs = require('fs');

let puppeteerCore;
let chromium;

try {
    puppeteerCore = require('puppeteer-core');
} catch {
    logger.warn('puppeteer-core not available');
}

try {
    chromium = require('@sparticuz/chromium');
} catch {
    logger.warn('@sparticuz/chromium not available — will try local Chrome');
}

/**
 * Launch a headless browser using puppeteer-core.
 * Strategy:
 *  1. Try @sparticuz/chromium (works on Render / AWS Lambda / Linux cloud)
 *  2. Fall back to locally installed Chrome (dev machines)
 * Returns null if no browser is available.
 */
async function launchBrowser() {
    if (!puppeteerCore) return null;

    // --- Attempt 1: @sparticuz/chromium (cloud) ---
    if (chromium) {
        try {
            const executablePath = await chromium.executablePath();
            if (executablePath && fs.existsSync(executablePath)) {
                return await puppeteerCore.launch({
                    headless: chromium.headless,
                    executablePath,
                    ignoreHTTPSErrors: true,
                    args: chromium.args,
                });
            }
        } catch (error) {
            logger.debug(`@sparticuz/chromium failed: ${error.message}, trying local Chrome...`);
        }
    }

    // --- Attempt 2: local Chrome installation (dev) ---
    const localPath = findLocalChrome();
    if (localPath) {
        try {
            return await puppeteerCore.launch({
                headless: 'new',
                executablePath: localPath,
                ignoreHTTPSErrors: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
        } catch (error) {
            logger.error(`Failed to launch local Chrome: ${error.message}`);
        }
    }

    logger.warn('No Chrome executable found');
    return null;
}

/**
 * Try to find a local Chrome installation for development.
 */
function findLocalChrome() {
    const paths = [
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

    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }

    // Try puppeteer's bundled Chrome if available
    try {
        const puppeteer = require('puppeteer');
        const bundled = puppeteer.executablePath();
        if (bundled && fs.existsSync(bundled)) return bundled;
    } catch {
        // not available
    }

    return null;
}

module.exports = { launchBrowser };
