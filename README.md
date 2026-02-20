# JobFinder IL — Israeli Job Aggregator

> Search thousands of jobs across Israel from 18+ job boards. Filter, sort, deduplicate. All in one place.

## Architecture

| Component | Stack | Hosting |
|-----------|-------|---------|
| **Frontend** | Next.js 14, React Query, Framer Motion | Vercel |
| **Backend** | Express, Puppeteer, Cheerio, Prisma | Render |
| **Database** | PostgreSQL | Render |

## Job Sites (18)

AllJobs · Drushim · JobMaster · LinkedIn · Indeed · GotFriends · SQLink · Ethosia · Secret Tel Aviv · Janglo · Taasuka · Gov.il · Shatil · Taasiya · JobKarov · xPlace · NBN · Glassdoor

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

Open http://localhost:3000

## Features

- 🔍 Full-text search across title, company, description
- 📂 Filter by category, location, job type, experience, source, salary
- 🏢 Hide jobs from unknown/unnamed employers
- 🔄 Automatic deduplication (URL + fingerprint + fuzzy matching)
- 📊 Sort by date, relevance, salary, company
- 🌙 Dark/light theme
- 📱 Responsive (mobile + desktop)
- ⏰ Automated scraping every 6 hours

## Deployment

### Backend → Render
1. Connect your GitHub repo
2. Use `render.yaml` for configuration
3. Render auto-provisions PostgreSQL

### Frontend → Vercel
1. Import the `frontend/` directory
2. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
3. Deploy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (with filters) |
| GET | `/api/jobs/:id` | Job details |
| GET | `/api/jobs/stats` | Aggregated statistics |
| GET | `/api/jobs/filters` | Available filter values |
| GET | `/api/jobs/meta` | Static metadata |
| POST | `/api/scrape/trigger` | Trigger manual scrape |
| GET | `/api/scrape/status` | Scrape logs |
| GET | `/api/health` | Health check |
