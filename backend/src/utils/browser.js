const logger = require('./logger');

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
 * Launch a headless browser using puppeteer-core + @sparticuz/chromium.
 * Falls back to local Chrome path for development.
 * Returns null if no browser is available.
 */
async function launchBrowser() {
    if (!puppeteerCore) return null;

    try {
        const executablePath = chromium
            ? await chromium.executablePath()
            : findLocalChrome();

        if (!executablePath) {
            logger.warn('No Chrome executable found');
            return null;
        }

        return await puppeteerCore.launch({
            headless: chromium ? chromium.headless : 'new',
            executablePath,
            ignoreHTTPSErrors: true,
            args: chromium
                ? chromium.args
                : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    } catch (error) {
        logger.error(`Failed to launch browser: ${error.message}`);
        return null;
    }
}

/**
 * Try to find a local Chrome installation for development.
 */
function findLocalChrome() {
    const fs = require('fs');
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
        return puppeteer.executablePath();
    } catch {
        return null;
    }
}

module.exports = { launchBrowser };
