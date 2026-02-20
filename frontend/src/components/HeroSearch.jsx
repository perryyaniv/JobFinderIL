'use client';

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function HeroSearch({ value, locationValue, onSearch, onLocationChange }) {
    const [query, setQuery] = useState(value || '');
    const [location, setLocation] = useState(locationValue || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
        if (location) onLocationChange(location);
    };

    return (
        <section className="hero-section">
            <h1 className="hero-title">
                המשרה הבאה שלך כבר כאן
            </h1>
            <p className="hero-subtitle">
                חיפוש אלפי משרות מ-18+ אתרי דרושים — הכל במקום אחד.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <Search size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="תפקיד, מילת מפתח או חברה..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onBlur={() => onSearch(query)}
                            id="search-query"
                        />
                    </div>

                    <div className="search-divider" />

                    <div className="search-input-wrapper">
                        <MapPin size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="עיר או אזור..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onBlur={() => onLocationChange(location)}
                            id="search-location"
                        />
                    </div>

                    <button type="submit" className="search-btn" id="search-submit">
                        חיפוש
                    </button>
                </div>
            </form>
        </section>
    );
}
