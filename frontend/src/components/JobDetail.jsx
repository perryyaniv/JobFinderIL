'use client';

import { X, MapPin, Building2, Clock, Wifi, ExternalLink, CheckCircle2, Heart, EyeOff } from 'lucide-react';
import SourceBadge from './SourceBadge';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function JobDetail({ job, onClose, onToggleFavorite, onHide }) {
    const [fullJob, setFullJob] = useState(job);

    // Fetch full job data (list endpoint excludes description)
    useEffect(() => {
        if (!job?.id) return;
        api.getJob(job.id).then(data => {
            if (data) setFullJob(data);
        }).catch(() => {
            // Keep the partial data if fetch fails
        });
    }, [job?.id]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!fullJob) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="סגירה">
                    <X size={18} />
                </button>

                <div style={{ marginBottom: '20px' }}>
                    <SourceBadge source={fullJob.sourceSite} />
                </div>

                <h2 className="modal-title">{fullJob.titleHe || fullJob.title}</h2>

                {fullJob.company && (
                    <div className="modal-company">
                        <Building2 size={16} style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'text-bottom' }} />
                        {fullJob.company}
                        {fullJob.companyVerified && (
                            <span className="verified-badge" style={{ marginRight: '6px', display: 'inline-flex' }}>
                                <CheckCircle2 size={10} />
                            </span>
                        )}
                    </div>
                )}

                <div className="job-meta" style={{ marginBottom: '24px' }}>
                    {fullJob.city && (
                        <span className="job-meta-item">
                            <MapPin size={14} />
                            {fullJob.city}
                            {fullJob.region && ` (${fullJob.region})`}
                        </span>
                    )}
                    {fullJob.jobType && (
                        <span className="job-meta-item">
                            <Clock size={14} />
                            {fullJob.jobType}
                        </span>
                    )}
                    {fullJob.isRemote && (
                        <span className="job-meta-item">
                            <Wifi size={14} />
                            מרחוק
                        </span>
                    )}
                    {fullJob.experienceLevel && (
                        <span className="job-meta-item">
                            {fullJob.experienceLevel}
                        </span>
                    )}
                </div>

                {/* Salary */}
                {fullJob.salary && (
                    <div className="modal-section">
                        <h3>שכר</h3>
                        <p style={{ color: 'var(--accent-success)', fontSize: '1.1rem', fontWeight: 600 }}>
                            ₪{fullJob.salary}
                        </p>
                    </div>
                )}

                {/* Tags */}
                {(fullJob.skills?.length > 0 || fullJob.isRemote || fullJob.isHybrid || fullJob.category) && (
                    <div className="modal-section">
                        <h3>תגיות</h3>
                        <div className="job-tags">
                            {fullJob.isRemote && <span className="job-tag remote">מרחוק</span>}
                            {fullJob.isHybrid && <span className="job-tag hybrid">היברידי</span>}
                            {fullJob.category && <span className="job-tag">{fullJob.category}</span>}
                            {fullJob.skills?.map(skill => (
                                <span key={skill} className="job-tag">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {(fullJob.descriptionHe || fullJob.description) && (
                    <div className="modal-section">
                        <h3>תיאור המשרה</h3>
                        <div className="modal-description">
                            {fullJob.descriptionHe || fullJob.description}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="modal-actions">
                    <button
                        className={`modal-action-btn favorite-btn ${fullJob.isFavorite ? 'active' : ''}`}
                        onClick={() => {
                            onToggleFavorite(fullJob.id);
                            setFullJob(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
                        }}
                    >
                        <Heart size={18} fill={fullJob.isFavorite ? 'currentColor' : 'none'} />
                        {fullJob.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                    </button>
                    <button
                        className="modal-action-btn hide-btn"
                        onClick={() => {
                            onHide(fullJob.id);
                            onClose();
                        }}
                    >
                        <EyeOff size={18} />
                        הסתר משרה
                    </button>
                </div>

                {/* Apply button */}
                <a
                    href={fullJob.sourceUrl || fullJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-apply-btn"
                    style={{ textDecoration: 'none' }}
                >
                    <ExternalLink size={16} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'text-bottom' }} />
                    עבור ל-{getSourceName(fullJob.sourceSite)}
                </a>

                <p style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '12px',
                }}>
                    תועברו לדף המשרה המקורי
                </p>
            </div>
        </div>
    );
}

function getSourceName(sourceId) {
    const names = {
        alljobs: 'AllJobs', drushim: 'Drushim', jobmaster: 'JobMaster', linkedin: 'LinkedIn',
        indeed: 'Indeed', gotfriends: 'GotFriends', sqlink: 'SQLink', ethosia: 'Ethosia',
        secrettelaviv: 'Secret Tel Aviv', janglo: 'Janglo', taasuka: 'Taasuka', govil: 'Gov.il',
        shatil: 'Shatil', taasiya: 'Taasiya', jobkarov: 'JobKarov', xplace: 'xPlace',
        nbn: 'NBN', glassdoor: 'Glassdoor',
    };
    return names[sourceId] || sourceId;
}
