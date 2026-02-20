'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

const POLL_INTERVAL_MS = 3000;
const EXPECTED_WAKE_MS = 45000;
const MAX_PROGRESS_BEFORE_READY = 90;
const ERROR_THRESHOLD_MS = 60000;

export default function useServerWakeUp() {
    const [serverReady, setServerReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    const checkHealth = useCallback(async () => {
        try {
            await api.getHealth();
            setServerReady(true);
            setProgress(100);
            setError(null);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now();
            }
            const elapsed = Date.now() - startTimeRef.current;
            const estimated = Math.min(
                MAX_PROGRESS_BEFORE_READY,
                Math.floor((elapsed / EXPECTED_WAKE_MS) * MAX_PROGRESS_BEFORE_READY)
            );
            setProgress(estimated);

            if (elapsed > ERROR_THRESHOLD_MS) {
                setError('השרת לא מגיב. ממשיכים לנסות...');
            }
        }
    }, []);

    useEffect(() => {
        checkHealth();
        intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkHealth]);

    return { serverReady, progress, error };
}
