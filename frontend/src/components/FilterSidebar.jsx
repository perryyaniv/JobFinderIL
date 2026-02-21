'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const SOURCE_COLORS = {
    alljobs: '#FF6B00', drushim: '#00A651', jobmaster: '#0066CC', linkedin: '#0A66C2',
    indeed: '#2164F3', gotfriends: '#E91E63', sqlink: '#FF5722', ethosia: '#9C27B0',
    secrettelaviv: '#FF4081', janglo: '#4CAF50', taasuka: '#607D8B', govil: '#3F51B5',
    shatil: '#009688', taasiya: '#795548', jobkarov: '#FFC107', xplace: '#673AB7',
    nbn: '#2196F3', glassdoor: '#0CAA41',
};

export default function FilterSidebar({ params, meta, onFilter, onToggle, isOpen, onClose }) {
    const [openSections, setOpenSections] = useState({
        jobType: true,
        category: false,
        source: false,
        experience: false,
        date: true,
        employer: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const jobTypes = meta?.jobTypes || [
        { key: 'FULL_TIME', label: 'משרה מלאה' },
        { key: 'PART_TIME', label: 'משרה חלקית' },
        { key: 'CONTRACT', label: 'חוזה' },
        { key: 'FREELANCE', label: 'פרילנס' },
        { key: 'INTERNSHIP', label: 'סטאז\'' },
    ];

    const categories = meta?.categories || [
        { key: 'SOFTWARE', label: 'פיתוח תוכנה' },
        { key: 'QA', label: 'בדיקות QA' },
        { key: 'DATA', label: 'דאטה ואנליטיקה' },
        { key: 'PRODUCT', label: 'ניהול מוצר' },
        { key: 'DESIGN', label: 'עיצוב ו-UX' },
        { key: 'MARKETING', label: 'שיווק' },
        { key: 'SALES', label: 'מכירות' },
        { key: 'HR', label: 'משאבי אנוש' },
        { key: 'FINANCE', label: 'כספים וחשבונאות' },
        { key: 'ENGINEERING', label: 'הנדסה' },
        { key: 'MANAGEMENT', label: 'ניהול ומנהלים' },
        { key: 'OTHER', label: 'אחר' },
    ];

    const experienceLevels = meta?.experienceLevels || [
        { key: 'ENTRY', label: 'ללא ניסיון' },
        { key: 'JUNIOR', label: 'ג׳וניור (1-2 שנים)' },
        { key: 'MID', label: 'ביניים (3-5 שנים)' },
        { key: 'SENIOR', label: 'בכיר (5+ שנים)' },
        { key: 'EXECUTIVE', label: 'מנהל / דירקטור' },
    ];

    const sources = meta?.sourceSites || Object.entries(SOURCE_COLORS).map(([id, color]) => ({
        id, name: id.charAt(0).toUpperCase() + id.slice(1), color,
    }));

    const dateOptions = [
        { value: '1', label: '24 שעות אחרונות' },
        { value: '3', label: '3 ימים אחרונים' },
        { value: '7', label: 'שבוע אחרון' },
        { value: '14', label: 'שבועיים אחרונים' },
        { value: '30', label: 'חודש אחרון' },
    ];

    const selectedJobTypes = params.jobType ? params.jobType.split(',').filter(Boolean) : [];
    const selectedSources = params.source ? params.source.split(',').filter(Boolean) : [];
    const selectedExperience = params.experienceLevel ? params.experienceLevel.split(',').filter(Boolean) : [];

    return (
        <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
            {isOpen && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>סינון</span>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', padding: '4px',
                    }}>
                        <X size={20} />
                    </button>
                </div>
            )}

            <div className="toggle-container" onClick={() => onFilter('hideUnknownEmployer', params.hideUnknownEmployer === 'true' ? '' : 'true')} id="toggle-unknown-employer">
                <span className="toggle-label">הסתר מעסיקים חסויים</span>
                <div className={`toggle-switch ${params.hideUnknownEmployer === 'true' ? 'active' : ''}`} />
            </div>

            <div className="toggle-container" onClick={() => onFilter('remote', params.remote === 'true' ? '' : 'true')}>
                <span className="toggle-label">עבודה מרחוק בלבד</span>
                <div className={`toggle-switch ${params.remote === 'true' ? 'active' : ''}`} />
            </div>

            <div className="toggle-container" onClick={() => onFilter('hybrid', params.hybrid === 'true' ? '' : 'true')}>
                <span className="toggle-label">היברידי</span>
                <div className={`toggle-switch ${params.hybrid === 'true' ? 'active' : ''}`} />
            </div>

            <div className="toggle-container" onClick={() => onFilter('favorites', params.favorites === 'true' ? '' : 'true')}>
                <span className="toggle-label">מועדפים בלבד</span>
                <div className={`toggle-switch ${params.favorites === 'true' ? 'active' : ''}`} />
            </div>

            <div className="toggle-container" onClick={() => onFilter('sentCV', params.sentCV === 'true' ? '' : 'true')}>
                <span className="toggle-label">שלחתי קו״ח בלבד</span>
                <div className={`toggle-switch ${params.sentCV === 'true' ? 'active' : ''}`} />
            </div>

            <div className="filter-section">
                <div className={`filter-header ${openSections.date ? 'open' : ''}`} onClick={() => toggleSection('date')}>
                    <span>תאריך פרסום</span>
                    <ChevronDown size={16} />
                </div>
                {openSections.date && (
                    <div className="filter-body">
                        <div className={`filter-option ${!params.daysAgo ? 'active' : ''}`} onClick={() => onFilter('daysAgo', '')}>הכל</div>
                        {dateOptions.map(opt => (
                            <div key={opt.value} className={`filter-option ${params.daysAgo === opt.value ? 'active' : ''}`} onClick={() => onFilter('daysAgo', opt.value)}>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-section">
                <div className={`filter-header ${openSections.jobType ? 'open' : ''}`} onClick={() => toggleSection('jobType')}>
                    <span>סוג משרה</span>
                    <ChevronDown size={16} />
                </div>
                {openSections.jobType && (
                    <div className="filter-body">
                        {jobTypes.map(type => (
                            <label key={type.key} className={`filter-option ${selectedJobTypes.includes(type.key) ? 'active' : ''}`}>
                                <input type="checkbox" checked={selectedJobTypes.includes(type.key)} onChange={() => onToggle('jobType', type.key)} />
                                {type.he || type.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-section">
                <div className={`filter-header ${openSections.category ? 'open' : ''}`} onClick={() => toggleSection('category')}>
                    <span>קטגוריה</span>
                    <ChevronDown size={16} />
                </div>
                {openSections.category && (
                    <div className="filter-body" style={{ maxHeight: '200px', overflow: 'auto' }}>
                        <div className={`filter-option ${!params.category ? 'active' : ''}`} onClick={() => onFilter('category', '')}>כל הקטגוריות</div>
                        {categories.map(cat => (
                            <div key={cat.key} className={`filter-option ${params.category === cat.key ? 'active' : ''}`} onClick={() => onFilter('category', cat.key)}>
                                {cat.he || cat.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-section">
                <div className={`filter-header ${openSections.experience ? 'open' : ''}`} onClick={() => toggleSection('experience')}>
                    <span>רמת ניסיון</span>
                    <ChevronDown size={16} />
                </div>
                {openSections.experience && (
                    <div className="filter-body">
                        {experienceLevels.map(level => (
                            <label key={level.key} className={`filter-option ${selectedExperience.includes(level.key) ? 'active' : ''}`}>
                                <input type="checkbox" checked={selectedExperience.includes(level.key)} onChange={() => onToggle('experienceLevel', level.key)} />
                                {level.he || level.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-section">
                <div className={`filter-header ${openSections.source ? 'open' : ''}`} onClick={() => toggleSection('source')}>
                    <span>אתר מקור</span>
                    <ChevronDown size={16} />
                </div>
                {openSections.source && (
                    <div className="filter-body" style={{ maxHeight: '250px', overflow: 'auto' }}>
                        {sources.map(site => (
                            <label key={site.id} className={`filter-option ${selectedSources.includes(site.id) ? 'active' : ''}`}>
                                <input type="checkbox" checked={selectedSources.includes(site.id)} onChange={() => onToggle('source', site.id)} />
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: site.color || SOURCE_COLORS[site.id] || '#666', flexShrink: 0 }} />
                                {site.name}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-section">
                <div className="filter-header" style={{ cursor: 'default' }}>
                    <span>טווח שכר (₪)</span>
                </div>
                <div className="filter-body" style={{ flexDirection: 'row', gap: '8px' }}>
                    <input type="number" placeholder="מינימום" value={params.salaryMin || ''} onChange={(e) => onFilter('salaryMin', e.target.value)} style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', maxWidth: '120px' }} />
                    <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>–</span>
                    <input type="number" placeholder="מקסימום" value={params.salaryMax || ''} onChange={(e) => onFilter('salaryMax', e.target.value)} style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', maxWidth: '120px' }} />
                </div>
            </div>
        </aside>
    );
}
