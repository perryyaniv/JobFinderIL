'use client';

import { useScrapers } from '../hooks/useScrapers';
import {
    Radio, Play, RefreshCw, Clock, AlertTriangle,
    CheckCircle2, XCircle, Loader2, Zap, BarChart3,
} from 'lucide-react';

function formatRelativeTime(dateStr) {
    if (!dateStr) return 'לא רץ אף פעם';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'הרגע';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
}

function formatDuration(ms) {
    if (!ms) return '—';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainSec = seconds % 60;
    return `${minutes}m ${remainSec}s`;
}

function StatusIndicator({ status }) {
    const config = {
        success: { icon: CheckCircle2, label: 'הצלחה', className: 'success' },
        failed: { icon: XCircle, label: 'נכשל', className: 'failed' },
        never: { icon: Clock, label: 'טרם רץ', className: 'never' },
    };
    const { icon: Icon, label, className } = config[status] || config.never;
    return (
        <span className={`scraper-status ${className}`}>
            <Icon size={14} />
            {label}
        </span>
    );
}

export default function ScrapersDashboard() {
    const { sites, loading, error, scrapingInProgress, scrapingSiteId, triggerScrape } = useScrapers();

    const successCount = sites.filter(s => s.status === 'success').length;
    const failedCount = sites.filter(s => s.status === 'failed').length;
    const totalJobsFound = sites.reduce((sum, s) => sum + (s.jobsFound || 0), 0);
    const totalNewJobs = sites.reduce((sum, s) => sum + (s.jobsNew || 0), 0);

    const lastSuccessfulRun = sites
        .filter(s => s.status === 'success' && s.lastRun)
        .sort((a, b) => new Date(b.lastRun) - new Date(a.lastRun))[0];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)' }}>טוען נתוני סורקים...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state animate-fadeIn" style={{ padding: '24px' }}>
                <AlertTriangle size={48} />
                <h3>שגיאה בטעינת סורקים</h3>
                <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
                <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    וודאו שהשרת פועל: <code>cd backend && npm run dev</code>
                </p>
            </div>
        );
    }

    return (
        <div className="scrapers-dashboard animate-fadeIn">
            {/* Header */}
            <div className="scrapers-header">
                <div>
                    <h2 className="scrapers-title">
                        <Radio size={24} />
                        סורקים
                    </h2>
                    <p className="scrapers-subtitle">
                        ניהול ומעקב אחר 18 סורקי דרושים
                    </p>
                </div>
                <button
                    className="scan-all-btn"
                    onClick={() => triggerScrape()}
                    disabled={scrapingInProgress}
                >
                    {scrapingInProgress ? (
                        <>
                            <Loader2 size={16} className="spin-icon" />
                            סורק...
                        </>
                    ) : (
                        <>
                            <Zap size={16} />
                            סרוק הכל
                        </>
                    )}
                </button>
            </div>

            {/* Summary Stats */}
            <div className="scrapers-stats">
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value">{sites.length}</div>
                    <div className="scraper-stat-label">סורקים</div>
                </div>
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value success-text">{successCount}</div>
                    <div className="scraper-stat-label">הצליחו</div>
                </div>
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value danger-text">{failedCount}</div>
                    <div className="scraper-stat-label">נכשלו</div>
                </div>
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value">{totalJobsFound.toLocaleString()}</div>
                    <div className="scraper-stat-label">משרות נמצאו</div>
                </div>
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value accent-text">{totalNewJobs.toLocaleString()}</div>
                    <div className="scraper-stat-label">חדשות</div>
                </div>
                <div className="scraper-stat-card">
                    <div className="scraper-stat-value" style={{ fontSize: '0.95rem' }}>
                        {lastSuccessfulRun ? formatRelativeTime(lastSuccessfulRun.lastRun) : '—'}
                    </div>
                    <div className="scraper-stat-label">ריצה אחרונה</div>
                </div>
            </div>

            {/* Scraping in progress banner */}
            {scrapingInProgress && (
                <div className="scraping-banner animate-fadeIn">
                    <Loader2 size={18} className="spin-icon" />
                    <span>סריקה מתבצעת... הדף יתעדכן אוטומטית כל 10 שניות.</span>
                </div>
            )}

            {/* Scraper Grid */}
            <div className="scraper-grid">
                {sites.map((site) => (
                    <div key={site.id} className="scraper-card animate-fadeIn">
                        {/* Color accent bar */}
                        <div
                            className="scraper-card-accent"
                            style={{ background: site.color }}
                        />

                        <div className="scraper-card-body">
                            {/* Top row: name + status */}
                            <div className="scraper-card-top">
                                <div className="scraper-name-row">
                                    <span
                                        className="scraper-color-dot"
                                        style={{ background: site.color }}
                                    />
                                    <h3 className="scraper-name">{site.name}</h3>
                                </div>
                                <StatusIndicator status={site.status} />
                            </div>

                            {/* Stats row */}
                            <div className="scraper-card-stats">
                                <div className="scraper-card-stat">
                                    <BarChart3 size={13} />
                                    <span>{site.jobsFound || 0} נמצאו</span>
                                </div>
                                <div className="scraper-card-stat">
                                    <Zap size={13} />
                                    <span>{site.jobsNew || 0} חדשות</span>
                                </div>
                                <div className="scraper-card-stat">
                                    <Clock size={13} />
                                    <span>{formatDuration(site.duration)}</span>
                                </div>
                            </div>

                            {/* Last run */}
                            <div className="scraper-last-run">
                                <Clock size={12} />
                                {formatRelativeTime(site.lastRun)}
                            </div>

                            {/* Error message */}
                            {site.status === 'failed' && site.error && (
                                <div className="scraper-error">
                                    <AlertTriangle size={12} />
                                    <span>{site.error}</span>
                                </div>
                            )}

                            {/* Scan button */}
                            <button
                                className="scan-site-btn"
                                onClick={() => triggerScrape(site.id)}
                                disabled={scrapingInProgress && (scrapingSiteId === null || scrapingSiteId === site.id)}
                            >
                                {scrapingInProgress && (scrapingSiteId === null || scrapingSiteId === site.id) ? (
                                    <Loader2 size={14} className="spin-icon" />
                                ) : (
                                    <Play size={14} />
                                )}
                                {scrapingInProgress && (scrapingSiteId === null || scrapingSiteId === site.id) ? 'סורק...' : 'סרוק עכשיו'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
