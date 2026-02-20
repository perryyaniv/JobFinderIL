'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, User } from 'lucide-react';
import useServerWakeUp from '../hooks/useServerWakeUp';

export default function LoginScreen({ onReady }) {
    const [name, setName] = useState('');
    const [storedName, setStoredName] = useState(null);
    const [nameSubmitted, setNameSubmitted] = useState(false);
    const { serverReady, progress, error } = useServerWakeUp();

    // Apply saved theme so login screen respects light/dark preference
    useEffect(() => {
        const theme = localStorage.getItem('jobfinder-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    // Check for returning user
    useEffect(() => {
        const saved = localStorage.getItem('jobfinder-username');
        if (saved) {
            setStoredName(saved);
            setName(saved);
            setNameSubmitted(true);
        } else {
            setStoredName('');
        }
    }, []);

    // Auto-proceed when both conditions met
    const stableOnReady = useCallback(onReady, [onReady]);
    useEffect(() => {
        if (nameSubmitted && serverReady) {
            const timer = setTimeout(() => stableOnReady(), 600);
            return () => clearTimeout(timer);
        }
    }, [nameSubmitted, serverReady, stableOnReady]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        localStorage.setItem('jobfinder-username', trimmed);
        setNameSubmitted(true);
    };

    return (
        <div className="login-overlay">
            <div className="login-card animate-fadeIn">
                {/* Logo */}
                <div className="login-logo">
                    <div className="logo-icon">
                        <Briefcase size={24} />
                    </div>
                    <span className="login-logo-text">JobFinder IL</span>
                </div>

                {/* Returning user */}
                {storedName ? (
                    <div className="login-welcome">
                        <h2>שלום, {storedName}!</h2>
                        <p>מכין את הכל בשבילך...</p>
                    </div>
                ) : storedName === '' ? (
                    /* New user */
                    <form onSubmit={handleSubmit} className="login-form">
                        <h2>ברוכים הבאים!</h2>
                        <p>איך לקרוא לך?</p>
                        <div className="login-input-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                className="login-input"
                                placeholder="השם שלך..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                maxLength={30}
                            />
                        </div>
                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={!name.trim()}
                        >
                            {nameSubmitted && !serverReady ? 'ממתין לשרת...' : 'כניסה'}
                        </button>
                    </form>
                ) : null}

                {/* Progress bar — always visible */}
                <div className="login-progress-section">
                    <div className="login-progress-track">
                        <div
                            className={`login-progress-fill${serverReady ? ' complete' : ''}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className={`login-progress-text${serverReady ? ' ready' : ''}${error ? ' error' : ''}`}>
                        {serverReady
                            ? '✓ השרת מוכן!'
                            : error
                                ? error
                                : 'מתחבר לשרת...'}
                    </p>
                </div>
            </div>
        </div>
    );
}
