const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Jobs
    async getJobs(params = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        return this.request(`/api/jobs?${searchParams.toString()}`);
    }

    async getJob(id) {
        return this.request(`/api/jobs/${id}`);
    }

    async getStats() {
        return this.request('/api/jobs/stats');
    }

    async getFilterOptions() {
        return this.request('/api/jobs/filters');
    }

    async getMeta() {
        return this.request('/api/jobs/meta');
    }

    // Favorites & Hide
    async toggleFavorite(id) {
        return this.request(`/api/jobs/${id}/favorite`, { method: 'POST' });
    }

    async hideJob(id) {
        return this.request(`/api/jobs/${id}/hide`, { method: 'POST' });
    }

    // Health
    async getHealth() {
        return this.request('/api/health');
    }

    // Scrape management
    async triggerScrape(site = null, daysBack = null) {
        const params = new URLSearchParams();
        if (site) params.set('site', site);
        if (daysBack) params.set('daysBack', daysBack);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/api/scrape/trigger${query}`, { method: 'POST' });
    }

    async getScrapeStatus() {
        return this.request('/api/scrape/status');
    }

    async getScraperSites() {
        return this.request('/api/scrape/sites');
    }
}

const api = new ApiClient(API_BASE);
export default api;
