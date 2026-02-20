'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../lib/api';

export function useScrapers() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrapingInProgress, setScrapingInProgress] = useState(false);
    const [scrapingSiteId, setScrapingSiteId] = useState(null); // null = all, or specific site id
    const pollRef = useRef(null);

    const fetchSites = useCallback(async () => {
        try {
            const result = await api.getScraperSites();
            setSites(result.sites);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    // Poll every 10s while scraping is in progress
    useEffect(() => {
        if (scrapingInProgress) {
            pollRef.current = setInterval(fetchSites, 10000);
        } else if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [scrapingInProgress, fetchSites]);

    // Safety: stop polling after 10 minutes
    useEffect(() => {
        if (scrapingInProgress) {
            const timeout = setTimeout(() => setScrapingInProgress(false), 10 * 60 * 1000);
            return () => clearTimeout(timeout);
        }
    }, [scrapingInProgress]);

    const triggerScrape = useCallback(async (siteId = null) => {
        try {
            await api.triggerScrape(siteId);
            setScrapingInProgress(true);
            setScrapingSiteId(siteId);
            setTimeout(fetchSites, 2000);
        } catch (err) {
            setError(err.message);
        }
    }, [fetchSites]);

    return {
        sites,
        loading,
        error,
        scrapingInProgress,
        scrapingSiteId,
        triggerScrape,
        refresh: fetchSites,
    };
}
