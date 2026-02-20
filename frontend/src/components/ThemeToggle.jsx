'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const stored = localStorage.getItem('jobfinder-theme') || 'dark';
        setTheme(stored);
        document.documentElement.setAttribute('data-theme', stored);
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('jobfinder-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <button className="theme-toggle" onClick={toggle} aria-label="החלף ערכת נושא" id="theme-toggle">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
