'use client';

import { MapPin, Building2, Clock, Wifi, CheckCircle2, Heart, EyeOff } from 'lucide-react';
import SourceBadge from './SourceBadge';

export default function JobCard({ job, onClick, onToggleFavorite, onHide }) {
    const timeAgo = job.postedAt ? getTimeAgo(new Date(job.postedAt)) : null;

    return (
        <div className="job-card" onClick={onClick} id={`job-${job.id}`}>
            <div className="job-card-header">
                <div style={{ flex: 1 }}>
                    <h3 className="job-title">{job.titleHe || job.title}</h3>
                    {job.company && (
                        <div className="job-company">
                            <Building2 size={14} />
                            {job.company}
                            {job.companyVerified && (
                                <span className="verified-badge" title="מעסיק מאומת">
                                    <CheckCircle2 size={10} />
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <SourceBadge source={job.sourceSite} />
            </div>

            <div className="job-meta">
                {job.city && (
                    <span className="job-meta-item">
                        <MapPin size={14} />
                        {job.city}
                    </span>
                )}
                {job.jobType && (
                    <span className="job-meta-item">
                        <Clock size={14} />
                        {job.jobType}
                    </span>
                )}
                {job.isRemote && (
                    <span className="job-meta-item">
                        <Wifi size={14} />
                        מרחוק
                    </span>
                )}
            </div>

            <div className="job-tags">
                {job.isRemote && <span className="job-tag remote">מרחוק</span>}
                {job.isHybrid && <span className="job-tag hybrid">היברידי</span>}
                {job.category && <span className="job-tag">{job.category}</span>}
                {job.experienceLevel && <span className="job-tag">{job.experienceLevel}</span>}
                {job.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="job-tag">{skill}</span>
                ))}
            </div>

            <div className="job-card-footer">
                <span className="job-date">
                    {timeAgo || 'פורסם לאחרונה'}
                </span>
                {job.salary && <span className="job-salary">₪{job.salary}</span>}
                <div className="job-card-actions">
                    <button
                        className={`job-action-btn favorite-btn ${job.isFavorite ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.id); }}
                        title={job.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                    >
                        <Heart size={16} fill={job.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        className="job-action-btn hide-btn"
                        onClick={(e) => { e.stopPropagation(); onHide(job.id); }}
                        title="הסתר משרה"
                    >
                        <EyeOff size={16} />
                    </button>
                </div>
                <button
                    className="apply-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(job.sourceUrl || job.url, '_blank', 'noopener');
                    }}
                >
                    פרטים ←
                </button>
            </div>
        </div>
    );
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `לפני ${diffMins} דק׳`;
    if (diffHours < 24) return `לפני ${diffHours} שע׳`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שב׳`;
    return `לפני ${Math.floor(diffDays / 30)} חו׳`;
}
