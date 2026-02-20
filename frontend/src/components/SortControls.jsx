'use client';

export default function SortControls({ sort, total, onSortChange }) {
    return (
        <div className="controls-bar">
            <span className="results-count">
                <strong>{total?.toLocaleString() || 0}</strong> משרות נמצאו
            </span>

            <select
                className="sort-select"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                id="sort-select"
            >
                <option value="date_desc">החדשות ביותר</option>
                <option value="date_asc">הישנות ביותר</option>
                <option value="relevance">הרלוונטיות ביותר</option>
                <option value="company_asc">חברה א–ת</option>
                <option value="company_desc">חברה ת–א</option>
                <option value="salary_desc">שכר גבוה</option>
                <option value="salary_asc">שכר נמוך</option>
            </select>
        </div>
    );
}
