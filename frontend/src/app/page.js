'use client';

import { useState } from 'react';
import { useJobs, useStats, useMeta } from '../hooks/useJobs';
import HeroSearch from '../components/HeroSearch';
import FilterSidebar from '../components/FilterSidebar';
import JobCard from '../components/JobCard';
import JobDetail from '../components/JobDetail';
import SortControls from '../components/SortControls';
import StatsBar from '../components/StatsBar';
import ThemeToggle from '../components/ThemeToggle';
import Pagination from '../components/Pagination';
import ActiveFilters from '../components/ActiveFilters';
import ScrapersDashboard from '../components/ScrapersDashboard';
import { Briefcase, SlidersHorizontal, X, Radio } from 'lucide-react';

export default function HomePage() {
    const {
        jobs, pagination, loading, error, params,
        activeFilters, setSearch, setFilter, toggleFilter,
        setSort, setPage, clearFilters, clearFilter,
        toggleFavorite, hideJob,
    } = useJobs();

    const { stats } = useStats();
    const { meta } = useMeta();

    const [selectedJob, setSelectedJob] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('jobs');

    return (
        <>
            {/* Header */}
            <header className="header">
                <div className="header-inner">
                    <div className="logo">
                        <div className="logo-icon">
                            <Briefcase size={20} />
                        </div>
                        JobFinder IL
                    </div>
                    <div className="header-actions">
                        <div className="header-tabs">
                            <button
                                className={`header-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('jobs')}
                            >
                                <Briefcase size={14} />
                                משרות
                            </button>
                            <button
                                className={`header-tab ${activeTab === 'scrapers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('scrapers')}
                            >
                                <Radio size={14} />
                                סורקים
                            </button>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <div className="app-container">
                {activeTab === 'scrapers' ? (
                    <ScrapersDashboard />
                ) : (
                    <>
                        {/* Hero Search */}
                        <HeroSearch
                            value={params.q}
                            locationValue={params.city}
                            onSearch={setSearch}
                            onLocationChange={(city) => setFilter('city', city)}
                        />

                        {/* Stats Bar */}
                        <StatsBar stats={stats} loading={loading} total={pagination.total} />

                        {/* Active Filters */}
                        {activeFilters.length > 0 && (
                            <ActiveFilters
                                filters={activeFilters}
                                onRemove={clearFilter}
                                onClearAll={clearFilters}
                            />
                        )}

                        {/* Mobile Filter Toggle */}
                        <button
                            className="mobile-filter-btn"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <SlidersHorizontal size={16} />
                            סינון
                        </button>

                        {/* Main Content */}
                        <div className="main-content">
                            {/* Filter Sidebar */}
                            <FilterSidebar
                                params={params}
                                meta={meta}
                                onFilter={setFilter}
                                onToggle={toggleFilter}
                                isOpen={sidebarOpen}
                                onClose={() => setSidebarOpen(false)}
                            />

                            {/* Jobs Column */}
                            <div>
                                <SortControls
                                    sort={params.sort}
                                    total={pagination.total}
                                    onSortChange={setSort}
                                />

                                {/* Error */}
                                {error && (
                                    <div className="empty-state animate-fadeIn" style={{ padding: '24px' }}>
                                        <p style={{ color: 'var(--accent-danger)' }}>⚠️ {error}</p>
                                        <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                                            ייתכן שהשרת לא פועל. הפעילו אותו עם: <code>cd backend && npm run dev</code>
                                        </p>
                                    </div>
                                )}

                                {/* Loading */}
                                {loading && (
                                    <div className="loading-container">
                                        <div className="spinner"></div>
                                        <p style={{ color: 'var(--text-muted)' }}>מחפש ב-18 אתרי דרושים...</p>
                                    </div>
                                )}

                                {/* Job List */}
                                {!loading && jobs.length > 0 && (
                                    <div className="job-list">
                                        {jobs.map((job, index) => (
                                            <div
                                                key={job.id}
                                                className="animate-fadeIn"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <JobCard
                                                    job={job}
                                                    onClick={() => setSelectedJob(job)}
                                                    onToggleFavorite={toggleFavorite}
                                                    onHide={hideJob}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && !error && jobs.length === 0 && (
                                    <div className="empty-state animate-fadeIn">
                                        <Briefcase size={64} />
                                        <h3>לא נמצאו משרות</h3>
                                        <p>נסו לשנות את החיפוש או הסינון כדי למצוא תוצאות.</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <Pagination
                                        page={pagination.page}
                                        totalPages={pagination.totalPages}
                                        onPageChange={setPage}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Mobile sidebar backdrop */}
                        {sidebarOpen && (
                            <div
                                className="filter-backdrop open"
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}

                        {/* Job Detail Modal */}
                        {selectedJob && (
                            <JobDetail
                                job={selectedJob}
                                onClose={() => setSelectedJob(null)}
                                onToggleFavorite={toggleFavorite}
                                onHide={(id) => {
                                    hideJob(id);
                                    setSelectedJob(null);
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    );
}
