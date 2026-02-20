// Israeli regions for job location normalization
const REGIONS = {
    NORTH: 'צפון',
    HAIFA: 'חיפה',
    SHARON: 'שרון',
    CENTER: 'מרכז',
    TEL_AVIV: 'תל אביב',
    JERUSALEM: 'ירושלים',
    SOUTH: 'דרום',
    JUDEA_SAMARIA: 'יהודה ושומרון',
    REMOTE: 'עבודה מרחוק',
};

const REGIONS_EN = {
    NORTH: 'North',
    HAIFA: 'Haifa',
    SHARON: 'Sharon',
    CENTER: 'Center',
    TEL_AVIV: 'Tel Aviv',
    JERUSALEM: 'Jerusalem',
    SOUTH: 'South',
    JUDEA_SAMARIA: 'Judea & Samaria',
    REMOTE: 'Remote',
};

// Map of common cities to their regions
const CITY_TO_REGION = {
    'תל אביב': 'TEL_AVIV', 'tel aviv': 'TEL_AVIV', 'ramat gan': 'TEL_AVIV', 'רמת גן': 'TEL_AVIV',
    'בני ברק': 'TEL_AVIV', 'bnei brak': 'TEL_AVIV', 'גבעתיים': 'TEL_AVIV', 'givatayim': 'TEL_AVIV',
    'הרצליה': 'TEL_AVIV', 'herzliya': 'TEL_AVIV', 'פתח תקווה': 'CENTER', 'petah tikva': 'CENTER',
    'ירושלים': 'JERUSALEM', 'jerusalem': 'JERUSALEM',
    'חיפה': 'HAIFA', 'haifa': 'HAIFA',
    'באר שבע': 'SOUTH', 'beer sheva': 'SOUTH', 'beersheba': 'SOUTH',
    'נתניה': 'SHARON', 'netanya': 'SHARON', 'כפר סבא': 'SHARON', 'kfar saba': 'SHARON',
    'רעננה': 'SHARON', 'raanana': 'SHARON', 'הוד השרון': 'SHARON', 'hod hasharon': 'SHARON',
    'ראשון לציון': 'CENTER', 'rishon lezion': 'CENTER',
    'אשדוד': 'SOUTH', 'ashdod': 'SOUTH', 'אשקלון': 'SOUTH', 'ashkelon': 'SOUTH',
    'רחובות': 'CENTER', 'rehovot': 'CENTER', 'לוד': 'CENTER', 'lod': 'CENTER',
    'רמלה': 'CENTER', 'ramla': 'CENTER', 'מודיעין': 'CENTER', 'modiin': 'CENTER',
    'נצרת': 'NORTH', 'nazareth': 'NORTH', 'טבריה': 'NORTH', 'tiberias': 'NORTH',
    'עפולה': 'NORTH', 'afula': 'NORTH', 'כרמיאל': 'NORTH', 'karmiel': 'NORTH',
    'אילת': 'SOUTH', 'eilat': 'SOUTH',
    'יקנעם': 'NORTH', 'yokneam': 'NORTH',
    'קיסריה': 'SHARON', 'caesarea': 'SHARON',
};

// Job categories (bilingual)
const CATEGORIES = {
    SOFTWARE: { he: 'הייטק-תוכנה', en: 'Software Development' },
    HARDWARE: { he: 'הייטק-חומרה', en: 'Hardware Engineering' },
    QA: { he: 'בדיקות תוכנה', en: 'QA & Testing' },
    DATA: { he: 'דאטה ומידע', en: 'Data & Analytics' },
    DEVOPS: { he: 'דבאופס', en: 'DevOps & Infrastructure' },
    PRODUCT: { he: 'ניהול מוצר', en: 'Product Management' },
    DESIGN: { he: 'עיצוב', en: 'Design & UX' },
    MARKETING: { he: 'שיווק', en: 'Marketing' },
    SALES: { he: 'מכירות', en: 'Sales' },
    HR: { he: 'משאבי אנוש', en: 'Human Resources' },
    FINANCE: { he: 'כספים', en: 'Finance & Accounting' },
    ADMIN: { he: 'אדמיניסטרציה', en: 'Administration' },
    LEGAL: { he: 'משפטים', en: 'Legal' },
    MEDICAL: { he: 'רפואה', en: 'Medical & Healthcare' },
    EDUCATION: { he: 'הדרכה/הוראה', en: 'Education & Training' },
    ENGINEERING: { he: 'הנדסה', en: 'Engineering' },
    CUSTOMER_SERVICE: { he: 'שירות לקוחות', en: 'Customer Service' },
    LOGISTICS: { he: 'לוגיסטיקה', en: 'Logistics & Supply Chain' },
    MANAGEMENT: { he: 'ניהול', en: 'Management & Executive' },
    SCIENCE: { he: 'מדעים', en: 'Science & Biotech' },
    SECURITY: { he: 'אבטחת מידע', en: 'Cybersecurity' },
    OTHER: { he: 'כללי', en: 'Other' },
};

// Job types
const JOB_TYPES = {
    FULL_TIME: { he: 'משרה מלאה', en: 'Full-time' },
    PART_TIME: { he: 'משרה חלקית', en: 'Part-time' },
    CONTRACT: { he: 'חוזה', en: 'Contract' },
    FREELANCE: { he: 'פרילנס', en: 'Freelance' },
    INTERNSHIP: { he: 'סטאז\'', en: 'Internship' },
    TEMPORARY: { he: 'זמנית', en: 'Temporary' },
};

// Experience levels
const EXPERIENCE_LEVELS = {
    ENTRY: { he: 'ללא ניסיון', en: 'Entry Level' },
    JUNIOR: { he: 'ניסיון מועט', en: 'Junior (1-2 years)' },
    MID: { he: 'ניסיון בינוני', en: 'Mid Level (3-5 years)' },
    SENIOR: { he: 'ניסיון רב', en: 'Senior (5+ years)' },
    EXECUTIVE: { he: 'בכיר', en: 'Executive / Director' },
};

// Source site identifiers
const SOURCE_SITES = {
    ALLJOBS: { id: 'alljobs', name: 'AllJobs', url: 'https://www.alljobs.co.il/', color: '#FF6B00' },
    DRUSHIM: { id: 'drushim', name: 'Drushim', url: 'https://www.drushim.co.il/', color: '#00A651' },
    JOBMASTER: { id: 'jobmaster', name: 'JobMaster', url: 'https://www.jobmaster.co.il/', color: '#0066CC' },
    LINKEDIN: { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/jobs-in-israel/', color: '#0A66C2' },
    INDEED: { id: 'indeed', name: 'Indeed', url: 'https://il.indeed.com/', color: '#2164F3' },
    GOTFRIENDS: { id: 'gotfriends', name: 'GotFriends', url: 'https://www.gotfriends.co.il/', color: '#E91E63' },
    SQLINK: { id: 'sqlink', name: 'SQLink', url: 'https://www.sqlink.com/', color: '#FF5722' },
    ETHOSIA: { id: 'ethosia', name: 'Ethosia', url: 'https://www.ethosia.co.il/', color: '#9C27B0' },
    SECRET_TLV: { id: 'secrettelaviv', name: 'Secret Tel Aviv', url: 'https://www.secrettelaviv.com/jobs', color: '#FF4081' },
    JANGLO: { id: 'janglo', name: 'Janglo', url: 'https://www.janglo.net/jobs', color: '#4CAF50' },
    TAASUKA: { id: 'taasuka', name: 'Taasuka', url: 'https://www.taasuka.gov.il/', color: '#607D8B' },
    GOV_IL: { id: 'govil', name: 'Gov.il Careers', url: 'https://www.gov.il/he/departments/topics/careers/', color: '#3F51B5' },
    SHATIL: { id: 'shatil', name: 'Shatil', url: 'https://www.shatil.org.il/jobs', color: '#009688' },
    TAASIYA: { id: 'taasiya', name: 'Taasiya', url: 'https://www.taasiya.co.il/', color: '#795548' },
    JOBKAROV: { id: 'jobkarov', name: 'JobKarov', url: 'https://www.jobkarov.com/', color: '#FFC107' },
    XPLACE: { id: 'xplace', name: 'xPlace', url: 'https://www.xplace.com/il/', color: '#673AB7' },
    NBN: { id: 'nbn', name: 'NBN Job Board', url: 'https://www.nbn.org.il/jobboard/', color: '#2196F3' },
    GLASSDOOR: { id: 'glassdoor', name: 'Glassdoor', url: 'https://www.glassdoor.com/Job/israel-jobs-SRCH_IL.0,6_IN119.htm', color: '#0CAA41' },
};

module.exports = {
    REGIONS,
    REGIONS_EN,
    CITY_TO_REGION,
    CATEGORIES,
    JOB_TYPES,
    EXPERIENCE_LEVELS,
    SOURCE_SITES,
};
