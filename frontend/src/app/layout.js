import './globals.css';

export const metadata = {
    title: 'ג׳ובפיינדר — מצאו את המשרה הבאה שלכם בישראל',
    description: 'חיפוש אלפי משרות מ-18+ אתרי דרושים בישראל. סינון לפי מיקום, קטגוריה, שכר ועוד. מתעדכן כל 6 שעות.',
    keywords: 'דרושים, עבודה, משרות, חיפוש עבודה, jobs, israel, job search, careers',
    openGraph: {
        title: 'ג׳ובפיינדר — אגרגטור דרושים ישראלי',
        description: 'חיפוש אחד ב-AllJobs, Drushim, LinkedIn, Indeed ועוד 14 אתרי דרושים.',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="he" dir="rtl">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
