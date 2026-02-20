'use client';

import { Briefcase, TrendingUp, Clock } from 'lucide-react';

export default function StatsBar({ stats, loading, total }) {
    return (
        <div className="stats-bar">
            <div className="stat-item">
                <Briefcase size={16} />
                <span className="stat-value">{total?.toLocaleString() || '—'}</span>
                <span>משרות פעילות</span>
            </div>
            {stats && (
                <>
                    <div className="stat-item">
                        <TrendingUp size={16} />
                        <span className="stat-value">{stats.recent24h?.toLocaleString() || '0'}</span>
                        <span>חדשות היום</span>
                    </div>
                    <div className="stat-item">
                        <Clock size={16} />
                        <span className="stat-value">{stats.bySource?.length || 0}</span>
                        <span>אתרים פעילים</span>
                    </div>
                </>
            )}
        </div>
    );
}
