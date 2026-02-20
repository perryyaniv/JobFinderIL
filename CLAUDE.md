# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobFinder IL is a full-stack Israeli job aggregator that scrapes 18 job boards (AllJobs, Drushim, LinkedIn, Indeed, Glassdoor, etc.) into a unified MongoDB database, with a Next.js frontend for searching/filtering. The backend and frontend are in separate directories with independent `package.json` files (not a monorepo workspace).

## Commands

### Backend (run from `backend/`)
- `npm run dev` — Start dev server with `--watch` (port 3001)
- `npm start` — Production server
- `npm test` — Run Jest tests (uses `--experimental-vm-modules`)
- `npm run test:scrapers` — Run only scraper tests
- `npm run db:seed` — Seed the database

### Frontend (run from `frontend/`)
- `npm run dev` — Start Next.js dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint

### Environment Setup
Backend needs `.env` with `DATABASE_URL` (MongoDB connection string), `PORT`, `ALLOWED_ORIGINS`, `SCRAPE_INTERVAL_HOURS`.
Frontend needs `.env.local` with `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).

## Architecture

### Backend (`backend/src/`)
- **server.js** — Express app entry point; connects to MongoDB via Mongoose, mounts routes, middleware (CORS, Helmet, compression)
- **config/database.js** — Mongoose connection setup
- **models/Job.js** — Mongoose schema for jobs (bilingual fields, indexes, toJSON transform for `_id` → `id`)
- **models/ScrapeLog.js** — Mongoose schema for scrape audit logs
- **scheduler.js** — Cron-based scraping scheduler (runs every N hours per `SCRAPE_INTERVAL_HOURS`)
- **routes/jobs.js** — REST endpoints for job listing, search, filtering, stats, metadata
- **routes/scrape.js** — Manual scrape trigger and status endpoints
- **services/FilterService.js** — Builds Mongoose queries from API parameters (search, filters, sort, pagination)
- **services/DeduplicationService.js** — 3-layer dedup: exact URL → fingerprint (MD5 of title+company+city) → fuzzy match (Fuse.js, 85% threshold). Marks jobs inactive after 72 hours
- **scrapers/BaseScraper.js** — Abstract base class defining the scrape→normalize→save→log pipeline
- **scrapers/sites/** — 18 site-specific scraper implementations inheriting from BaseScraper. Each uses Puppeteer (browser automation) or Cheerio (HTML parsing)
- **utils/constants.js** — Israeli regions, job categories, types, experience levels, source site definitions with colors
- **utils/helpers.js** — Fingerprinting, region detection from city, date parsing, salary extraction

### Frontend (`frontend/src/`)
- **app/page.js** — Main page orchestrator; manages filter/search/sort/pagination state
- **app/globals.css** — Design system with CSS custom properties, dark/light theme, glass morphism, Inter+Heebo fonts (Latin+Hebrew)
- **hooks/useJobs.js** — Custom hooks (`useJobs`, `useStats`, `useMeta`, `useFilterOptions`) wrapping fetch calls with debouncing
- **lib/api.js** — `ApiClient` singleton using `fetch()` for all backend endpoints
- **components/** — HeroSearch, FilterSidebar, JobCard, JobDetail (modal), Pagination, SortControls, StatsBar, SourceBadge, ThemeToggle, ActiveFilters

### Database (Mongoose)
Two models: **Job** (all job data with bilingual fields `title`/`titleHe`, `description`/`descriptionHe`, dedup `fingerprint`, self-referencing `duplicateOfId`) and **ScrapeLog** (audit trail per scrape run). Schemas defined in `backend/src/models/`. No migration tooling needed — Mongoose manages schema in code and creates indexes on connection.

## Key Patterns

- **Adding a new scraper**: Create a class in `backend/src/scrapers/sites/` extending `BaseScraper`, implement `scrape()` method, add the site to `constants.js` SOURCE_SITES, and register it in the scheduler
- **Job normalization**: BaseScraper auto-detects remote/hybrid from text, maps city→region, extracts salary from description text
- **API filtering**: All query params on `GET /api/jobs` are built into Mongoose query filters by FilterService — search spans title, company, description in both languages
- **Deduplication runs** after each scrape batch, not as a separate scheduled task

## Tech Stack

- **Backend**: Node.js ≥20, Express, Mongoose (MongoDB), Puppeteer, Cheerio, Winston logging
- **Frontend**: Next.js 14, React 18, React Query, Framer Motion, CSS (no Tailwind/CSS-in-JS)
- **Deployment**: Backend on Render (`render.yaml`), Frontend on Vercel
