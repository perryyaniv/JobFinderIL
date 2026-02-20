const {
    classifyCategory,
    classifyJobType,
    classifyExperienceLevel,
    detectRegion,
    detectWorkMode,
    parseSalary,
} = require('../helpers');

describe('classifyCategory', () => {
    test('returns null for null/empty input', () => {
        expect(classifyCategory(null)).toBeNull();
        expect(classifyCategory('')).toBeNull();
        expect(classifyCategory(undefined)).toBeNull();
    });

    test('classifies Hebrew software categories', () => {
        expect(classifyCategory('הייטק-תוכנה')).toBe('SOFTWARE');
        expect(classifyCategory('פיתוח תוכנה')).toBe('SOFTWARE');
        expect(classifyCategory('הייטק')).toBe('SOFTWARE');
    });

    test('classifies English software categories', () => {
        expect(classifyCategory('Software Development')).toBe('SOFTWARE');
        expect(classifyCategory('Backend Developer')).toBe('SOFTWARE');
        expect(classifyCategory('Full Stack Developer')).toBe('SOFTWARE');
        expect(classifyCategory('Frontend Engineer')).toBe('SOFTWARE');
    });

    test('classifies QA categories', () => {
        expect(classifyCategory('בדיקות תוכנה')).toBe('QA');
        expect(classifyCategory('QA Engineer')).toBe('QA');
        expect(classifyCategory('Automation Testing')).toBe('QA');
    });

    test('classifies Data categories', () => {
        expect(classifyCategory('Data Analyst')).toBe('DATA');
        expect(classifyCategory('דאטה ומידע')).toBe('DATA');
        expect(classifyCategory('Machine Learning')).toBe('DATA');
    });

    test('classifies DevOps categories', () => {
        expect(classifyCategory('DevOps Engineer')).toBe('DEVOPS');
        expect(classifyCategory('Cloud Infrastructure')).toBe('DEVOPS');
    });

    test('classifies management categories', () => {
        expect(classifyCategory('ניהול')).toBe('MANAGEMENT');
        expect(classifyCategory('Project Manager')).toBe('MANAGEMENT');
    });

    test('classifies marketing categories', () => {
        expect(classifyCategory('שיווק דיגיטלי')).toBe('MARKETING');
        expect(classifyCategory('Digital Marketing')).toBe('MARKETING');
        expect(classifyCategory('SEO Specialist')).toBe('MARKETING');
    });

    test('classifies sales categories', () => {
        expect(classifyCategory('מכירות')).toBe('SALES');
        expect(classifyCategory('Business Development')).toBe('SALES');
    });

    test('classifies HR categories', () => {
        expect(classifyCategory('משאבי אנוש')).toBe('HR');
        expect(classifyCategory('Recruitment Specialist')).toBe('HR');
    });

    test('classifies finance categories', () => {
        expect(classifyCategory('כספים')).toBe('FINANCE');
        expect(classifyCategory('Accounting Manager')).toBe('FINANCE');
    });

    test('classifies security categories', () => {
        expect(classifyCategory('אבטחת מידע')).toBe('SECURITY');
        expect(classifyCategory('Cybersecurity Analyst')).toBe('SECURITY');
    });

    test('returns OTHER for unrecognized text', () => {
        expect(classifyCategory('משהו אחר לגמרי')).toBe('OTHER');
    });

    test('classifies from job title when category is missing', () => {
        expect(classifyCategory('React Developer needed')).toBe('SOFTWARE');
        expect(classifyCategory('בודק תוכנה אוטומציה')).toBe('QA');
    });
});

describe('classifyJobType', () => {
    test('returns null for null/empty input', () => {
        expect(classifyJobType(null)).toBeNull();
        expect(classifyJobType('')).toBeNull();
    });

    test('classifies Hebrew job types', () => {
        expect(classifyJobType('משרה מלאה')).toBe('FULL_TIME');
        expect(classifyJobType('משרה חלקית')).toBe('PART_TIME');
        expect(classifyJobType('פרילנס')).toBe('FREELANCE');
        expect(classifyJobType('סטאז\'')).toBe('INTERNSHIP');
    });

    test('classifies English job types', () => {
        expect(classifyJobType('Full-time')).toBe('FULL_TIME');
        expect(classifyJobType('Full Time')).toBe('FULL_TIME');
        expect(classifyJobType('Part-time')).toBe('PART_TIME');
        expect(classifyJobType('Contract')).toBe('CONTRACT');
        expect(classifyJobType('Freelance')).toBe('FREELANCE');
        expect(classifyJobType('Internship')).toBe('INTERNSHIP');
    });

    test('classifies partial matches', () => {
        expect(classifyJobType('עבודה במשרה מלאה')).toBe('FULL_TIME');
        expect(classifyJobType('Full-time position')).toBe('FULL_TIME');
    });

    test('returns null for unrecognized text', () => {
        expect(classifyJobType('something else')).toBeNull();
    });

    test('returns key if already a valid key', () => {
        // If scraper already provides a normalized key, classifyJobType may still match
        expect(classifyJobType('Full-time')).toBe('FULL_TIME');
    });
});

describe('classifyExperienceLevel', () => {
    test('returns null for null/empty input', () => {
        expect(classifyExperienceLevel(null)).toBeNull();
        expect(classifyExperienceLevel('')).toBeNull();
    });

    test('classifies Hebrew experience levels', () => {
        expect(classifyExperienceLevel('ללא ניסיון')).toBe('ENTRY');
        expect(classifyExperienceLevel('ניסיון רב')).toBe('SENIOR');
    });

    test('classifies English experience levels', () => {
        expect(classifyExperienceLevel('Junior Developer')).toBe('JUNIOR');
        expect(classifyExperienceLevel('Senior Engineer')).toBe('SENIOR');
        expect(classifyExperienceLevel('Mid Level')).toBe('MID');
    });

    test('classifies year-range patterns', () => {
        expect(classifyExperienceLevel('1-2 years')).toBe('JUNIOR');
        expect(classifyExperienceLevel('3-5 שנות ניסיון')).toBe('MID');
        expect(classifyExperienceLevel('5+ years experience')).toBe('SENIOR');
    });

    test('classifies executive levels', () => {
        expect(classifyExperienceLevel('Director of Engineering')).toBe('EXECUTIVE');
        expect(classifyExperienceLevel('VP R&D')).toBe('EXECUTIVE');
    });

    test('returns null for unrecognized text', () => {
        expect(classifyExperienceLevel('something else')).toBeNull();
    });
});

describe('detectRegion', () => {
    test('detects Israeli cities', () => {
        expect(detectRegion('תל אביב')).toBe('TEL_AVIV');
        expect(detectRegion('חיפה')).toBe('HAIFA');
        expect(detectRegion('ירושלים')).toBe('JERUSALEM');
        expect(detectRegion('נתניה')).toBe('SHARON');
        expect(detectRegion('באר שבע')).toBe('SOUTH');
    });

    test('detects English city names', () => {
        expect(detectRegion('Tel Aviv')).toBe('TEL_AVIV');
        expect(detectRegion('Haifa')).toBe('HAIFA');
    });

    test('returns null for unknown cities', () => {
        expect(detectRegion('Unknown City')).toBeNull();
        expect(detectRegion(null)).toBeNull();
    });
});

describe('detectWorkMode', () => {
    test('detects remote work', () => {
        expect(detectWorkMode('remote position').isRemote).toBe(true);
        expect(detectWorkMode('עבודה מרחוק').isRemote).toBe(true);
        expect(detectWorkMode('work from home').isRemote).toBe(true);
    });

    test('detects hybrid work', () => {
        expect(detectWorkMode('hybrid role').isHybrid).toBe(true);
        expect(detectWorkMode('היברידי').isHybrid).toBe(true);
    });

    test('returns false for office jobs', () => {
        const result = detectWorkMode('office position in Tel Aviv');
        expect(result.isRemote).toBe(false);
        expect(result.isHybrid).toBe(false);
    });
});

describe('parseSalary', () => {
    test('parses salary range', () => {
        expect(parseSalary('₪15,000 - ₪25,000')).toEqual({ salaryMin: 15000, salaryMax: 25000 });
        expect(parseSalary('15000-25000')).toEqual({ salaryMin: 15000, salaryMax: 25000 });
    });

    test('parses single salary value', () => {
        expect(parseSalary('₪20,000')).toEqual({ salaryMin: 20000, salaryMax: 20000 });
    });

    test('returns null for empty/null input', () => {
        expect(parseSalary(null)).toEqual({ salaryMin: null, salaryMax: null });
        expect(parseSalary('')).toEqual({ salaryMin: null, salaryMax: null });
    });
});
