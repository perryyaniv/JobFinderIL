'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../lib/api';

const DEFAULT_PARAMS = {
    q: '',
    category: '',
    city: '',
    region: '',
    remote: '',
    hybrid: '',
    jobType: '',
    experienceLevel: '',
    source: '',
    daysAgo: '',
    hideUnknownEmployer: '',
    salaryMin: '',
    salaryMax: '',
    favorites: '',
    sort: 'date_desc',
    page: 1,
    limit: 20,
};

export function useJobs() {
    const [params, setParams] = useState(DEFAULT_PARAMS);
    const [data, setData] = useState({ jobs: [], pagination: { page: 1, total: 0, totalPages: 0, hasMore: false } });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);

    const fetchJobs = useCallback(async (searchParams) => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.getJobs(searchParams);
            setData(result);
        } catch (err) {
            setError(err.message);
            // Show error but keep existing data
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced fetch on param change
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchJobs(params);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [params, fetchJobs]);

    const setSearch = useCallback((q) => {
        setParams(prev => ({ ...prev, q, page: 1 }));
    }, []);

    const setFilter = useCallback((key, value) => {
        setParams(prev => ({ ...prev, [key]: value, page: 1 }));
    }, []);

    const toggleFilter = useCallback((key, value) => {
        setParams(prev => {
            const current = prev[key] ? prev[key].split(',').filter(Boolean) : [];
            const idx = current.indexOf(value);
            if (idx >= 0) {
                current.splice(idx, 1);
            } else {
                current.push(value);
            }
            return { ...prev, [key]: current.join(','), page: 1 };
        });
    }, []);

    const setSort = useCallback((sort) => {
        setParams(prev => ({ ...prev, sort, page: 1 }));
    }, []);

    const setPage = useCallback((page) => {
        setParams(prev => ({ ...prev, page }));
    }, []);

    const clearFilters = useCallback(() => {
        setParams(DEFAULT_PARAMS);
    }, []);

    const clearFilter = useCallback((key) => {
        setParams(prev => ({ ...prev, [key]: DEFAULT_PARAMS[key], page: 1 }));
    }, []);

    const toggleFavorite = useCallback(async (jobId) => {
        setData(prev => ({
            ...prev,
            jobs: prev.jobs.map(job =>
                job.id === jobId ? { ...job, isFavorite: !job.isFavorite } : job
            ),
        }));
        try {
            await api.toggleFavorite(jobId);
        } catch {
            setData(prev => ({
                ...prev,
                jobs: prev.jobs.map(job =>
                    job.id === jobId ? { ...job, isFavorite: !job.isFavorite } : job
                ),
            }));
        }
    }, []);

    const hideJob = useCallback(async (jobId) => {
        setData(prev => ({
            ...prev,
            jobs: prev.jobs.filter(job => job.id !== jobId),
            pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
        }));
        try {
            await api.hideJob(jobId);
        } catch {
            fetchJobs(params);
        }
    }, [fetchJobs, params]);

    // Collect active filters for display
    const activeFilters = Object.entries(params)
        .filter(([key, value]) => {
            if (['sort', 'page', 'limit'].includes(key)) return false;
            return value !== '' && value !== DEFAULT_PARAMS[key];
        })
        .map(([key, value]) => ({ key, value }));

    return {
        jobs: data.jobs,
        pagination: data.pagination,
        loading,
        error,
        params,
        activeFilters,
        setSearch,
        setFilter,
        toggleFilter,
        setSort,
        setPage,
        clearFilters,
        clearFilter,
        toggleFavorite,
        hideJob,
        refresh: () => fetchJobs(params),
    };
}

export function useStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStats()
            .then(setStats)
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    return { stats, loading };
}

export function useMeta() {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getMeta()
            .then(setMeta)
            .catch(() => setMeta(null))
            .finally(() => setLoading(false));
    }, []);

    return { meta, loading };
}

export function useFilterOptions() {
    const [options, setOptions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getFilterOptions()
            .then(setOptions)
            .catch(() => setOptions(null))
            .finally(() => setLoading(false));
    }, []);

    return { options, loading };
}
