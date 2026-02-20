'use client';

import { X } from 'lucide-react';

const FILTER_LABELS = {
    q: 'חיפוש',
    category: 'קטגוריה',
    city: 'עיר',
    region: 'אזור',
    remote: 'מרחוק',
    hybrid: 'היברידי',
    jobType: 'סוג משרה',
    experienceLevel: 'ניסיון',
    source: 'מקור',
    daysAgo: 'פורסם',
    hideUnknownEmployer: 'הסתר חסויים',
    salaryMin: 'שכר מינימום',
    salaryMax: 'שכר מקסימום',
    favorites: 'מועדפים',
};

export default function ActiveFilters({ filters, onRemove, onClearAll }) {
    if (filters.length === 0) return null;

    return (
        <div className="active-filters">
            {filters.map(({ key, value }) => (
                <span key={key} className="active-filter-pill">
                    <strong>{FILTER_LABELS[key] || key}:</strong>
                    {formatValue(key, value)}
                    <button onClick={() => onRemove(key)} aria-label={`הסר סינון ${FILTER_LABELS[key] || key}`}>
                        <X size={12} />
                    </button>
                </span>
            ))}
            {filters.length > 1 && (
                <button className="clear-filters-btn" onClick={onClearAll}>
                    נקה הכל
                </button>
            )}
        </div>
    );
}

function formatValue(key, value) {
    if (key === 'hideUnknownEmployer') return 'כן';
    if (key === 'remote') return 'כן';
    if (key === 'hybrid') return 'כן';
    if (key === 'favorites') return 'כן';
    if (key === 'daysAgo') {
        const days = parseInt(value, 10);
        if (days === 1) return '24 שעות';
        return `${days} ימים אחרונים`;
    }
    if (typeof value === 'string' && value.length > 20) {
        return value.substring(0, 20) + '…';
    }
    return value;
}
