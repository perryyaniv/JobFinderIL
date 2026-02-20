const crypto = require('crypto');
const { CITY_TO_REGION, CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } = require('./constants');

/**
 * Generate a fingerprint for deduplication based on normalized job attributes.
 */
function generateFingerprint(title, company, city) {
    const normalized = [
        normalizeText(title || ''),
        normalizeText(company || ''),
        normalizeText(city || ''),
    ].join('|');

    return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Normalize text for comparison: lowercase, remove extra whitespace, 
 * strip common prefixes/suffixes, and transliterate common Hebrew patterns.
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[\u200F\u200E\u202A\u202B\u202C]/g, '') // Remove directional marks
        .replace(/[^\w\u0590-\u05FF\s]/g, ' ') // Keep alphanumeric + Hebrew chars
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Detect region from a city name.
 */
function detectRegion(city) {
    if (!city) return null;
    const normalized = city.toLowerCase().trim();

    for (const [cityName, regionKey] of Object.entries(CITY_TO_REGION)) {
        if (normalized.includes(cityName.toLowerCase())) {
            return regionKey;
        }
    }
    return null;
}

/**
 * Detect if a job is remote or hybrid from text content.
 */
function detectWorkMode(text) {
    if (!text) return { isRemote: false, isHybrid: false };
    const lower = text.toLowerCase();

    const remoteKeywords = ['remote', 'עבודה מרחוק', 'מהבית', 'from home', 'work from home', 'wfh'];
    const hybridKeywords = ['hybrid', 'היברידי', 'היברידית', 'flexible'];

    const isRemote = remoteKeywords.some(kw => lower.includes(kw));
    const isHybrid = hybridKeywords.some(kw => lower.includes(kw));

    return { isRemote, isHybrid };
}

/**
 * Parse salary text into min/max values (in ILS).
 */
function parseSalary(salaryText) {
    if (!salaryText) return { salaryMin: null, salaryMax: null };

    // Remove non-numeric except dash and comma
    const cleaned = salaryText.replace(/[₪,\s]/g, '');

    // Range pattern: "15000-25000" or "15000 - 25000"
    const rangeMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (rangeMatch) {
        return {
            salaryMin: parseInt(rangeMatch[1], 10),
            salaryMax: parseInt(rangeMatch[2], 10),
        };
    }

    // Single value
    const singleMatch = cleaned.match(/(\d+)/);
    if (singleMatch) {
        const val = parseInt(singleMatch[1], 10);
        return { salaryMin: val, salaryMax: val };
    }

    return { salaryMin: null, salaryMax: null };
}

/**
 * Parse a relative date string like "לפני 3 ימים" or "2 days ago"
 */
function parseRelativeDate(text) {
    if (!text) return null;
    const now = new Date();
    const lower = text.toLowerCase().trim();

    // "today" / "היום"
    if (lower === 'today' || lower === 'היום') return now;

    // "yesterday" / "אתמול"
    if (lower === 'yesterday' || lower === 'אתמול') {
        return new Date(now.setDate(now.getDate() - 1));
    }

    // "X days ago" / "לפני X ימים"
    const daysMatch = lower.match(/(\d+)\s*(days?|ימים|יום)/);
    if (daysMatch) {
        return new Date(now.setDate(now.getDate() - parseInt(daysMatch[1], 10)));
    }

    // "X hours ago" / "לפני X שעות"
    const hoursMatch = lower.match(/(\d+)\s*(hours?|שעות|שעה)/);
    if (hoursMatch) {
        return new Date(now.setHours(now.getHours() - parseInt(hoursMatch[1], 10)));
    }

    // "X weeks ago" / "לפני X שבועות"
    const weeksMatch = lower.match(/(\d+)\s*(weeks?|שבועות|שבוע)/);
    if (weeksMatch) {
        return new Date(now.setDate(now.getDate() - parseInt(weeksMatch[1], 10) * 7));
    }

    // "X months ago" / "לפני X חודשים"
    const monthsMatch = lower.match(/(\d+)\s*(months?|חודשים|חודש)/);
    if (monthsMatch) {
        return new Date(now.setMonth(now.getMonth() - parseInt(monthsMatch[1], 10)));
    }

    // Try standard date parse
    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Delay execution for a given number of milliseconds.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const waitTime = baseDelay * Math.pow(2, attempt - 1);
            await delay(waitTime);
        }
    }
}

/**
 * Classify a scraped category string into a standard category key.
 */
function classifyCategory(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    const patterns = {
        SOFTWARE: ['software', 'תוכנה', 'הייטק', 'hi-tech', 'hitech', 'פיתוח', 'fullstack', 'full-stack', 'full stack', 'backend', 'frontend', 'developer', 'מפתח', 'programmer', 'תכנות'],
        HARDWARE: ['hardware', 'חומרה', 'אלקטרוניקה', 'electronics', 'embedded', 'firmware'],
        QA: ['qa', 'בדיקות', 'quality', 'testing', 'בודק', 'automation', 'אוטומציה'],
        DATA: ['data', 'דאטה', 'מידע', 'analytics', 'אנליטיקה', 'bi ', 'machine learning', 'ml', 'ai ', 'בינה מלאכותית'],
        DEVOPS: ['devops', 'דבאופס', 'cloud', 'ענן', 'infrastructure', 'sre', 'platform', 'kubernetes', 'docker'],
        PRODUCT: ['product', 'מוצר', 'ניהול מוצר', 'product management'],
        DESIGN: ['design', 'עיצוב', 'ux', 'ui', 'גרפי', 'graphic'],
        MARKETING: ['marketing', 'שיווק', 'seo', 'sem', 'digital marketing', 'שיווק דיגיטלי', 'content', 'תוכן'],
        SALES: ['sales', 'מכירות', 'business development', 'פיתוח עסקי', 'account'],
        HR: ['hr', 'human resources', 'משאבי אנוש', 'recruitment', 'גיוס'],
        FINANCE: ['finance', 'כספים', 'חשבונאות', 'accounting', 'כלכלה', 'bookkeep'],
        ADMIN: ['admin', 'אדמיניסטרציה', 'office', 'משרד', 'secretary', 'מזכיר'],
        LEGAL: ['legal', 'משפט', 'law', 'עורך דין', 'lawyer', 'compliance'],
        MEDICAL: ['medical', 'רפואה', 'healthcare', 'בריאות', 'pharma', 'clinical', 'nurse', 'אח ', 'אחות', 'doctor', 'רופא'],
        EDUCATION: ['education', 'הדרכה', 'הוראה', 'training', 'teach', 'מורה', 'מדריך', 'tutor'],
        ENGINEERING: ['engineering', 'הנדסה', 'מהנדס', 'mechanical', 'civil', 'electrical'],
        CUSTOMER_SERVICE: ['customer service', 'שירות לקוחות', 'support', 'תמיכה', 'help desk'],
        LOGISTICS: ['logistics', 'לוגיסטיקה', 'supply chain', 'שרשרת', 'warehouse', 'מחסן', 'shipping', 'משלוח'],
        MANAGEMENT: ['management', 'ניהול', 'מנהל', 'manager', 'director', 'דירקטור', 'vp ', 'cto', 'ceo', 'coo', 'cfo'],
        SCIENCE: ['science', 'מדע', 'biotech', 'ביוטק', 'chemistry', 'כימיה', 'biology', 'ביולוגיה', 'research', 'מחקר'],
        SECURITY: ['security', 'אבטח', 'cyber', 'סייבר', 'infosec', 'penetration'],
    };

    for (const [key, keywords] of Object.entries(patterns)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return key;
        }
    }

    // Try matching against constant values
    for (const [key, val] of Object.entries(CATEGORIES)) {
        if (lower === val.he?.toLowerCase() || lower === val.en?.toLowerCase()) {
            return key;
        }
    }

    return 'OTHER';
}

/**
 * Classify a scraped job type string into a standard job type key.
 */
function classifyJobType(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    const patterns = {
        FULL_TIME: ['full time', 'full-time', 'fulltime', 'משרה מלאה', 'מלאה'],
        PART_TIME: ['part time', 'part-time', 'parttime', 'משרה חלקית', 'חלקית'],
        CONTRACT: ['contract', 'חוזה', 'outsource', 'מיקור חוץ'],
        FREELANCE: ['freelance', 'פרילנס', 'עצמאי', 'independent'],
        INTERNSHIP: ['internship', 'intern', 'סטאז', 'סטודנט', 'student'],
        TEMPORARY: ['temporary', 'temp ', 'זמני', 'זמנית'],
    };

    for (const [key, keywords] of Object.entries(patterns)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return key;
        }
    }

    // Try matching against constant values
    for (const [key, val] of Object.entries(JOB_TYPES)) {
        if (lower === val.he?.toLowerCase() || lower === val.en?.toLowerCase()) {
            return key;
        }
    }

    return null;
}

/**
 * Classify a scraped experience level string into a standard key.
 */
function classifyExperienceLevel(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    const patterns = {
        ENTRY: ['entry', 'ללא ניסיון', 'no experience', 'ניסיון', 'junior', '0-1', '0 -'],
        JUNIOR: ['junior', "ג'וניור", 'ג׳וניור', '1-2', '1-3', 'ניסיון מועט'],
        MID: ['mid', 'middle', 'ביניים', '3-5', '2-5', 'ניסיון בינוני'],
        SENIOR: ['senior', 'בכיר', 'ניסיון רב', '5+', '5-', '6+', '7+', 'experienced'],
        EXECUTIVE: ['executive', 'director', 'דירקטור', 'vp', 'head of', 'ראש', 'chief', 'c-level', 'מנהל בכיר'],
    };

    for (const [key, keywords] of Object.entries(patterns)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return key;
        }
    }

    // Try matching against constant values
    for (const [key, val] of Object.entries(EXPERIENCE_LEVELS)) {
        if (lower === val.he?.toLowerCase() || lower === val.en?.toLowerCase()) {
            return key;
        }
    }

    return null;
}

module.exports = {
    generateFingerprint,
    normalizeText,
    detectRegion,
    detectWorkMode,
    parseSalary,
    parseRelativeDate,
    delay,
    retry,
    classifyCategory,
    classifyJobType,
    classifyExperienceLevel,
};
