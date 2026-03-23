# Equiton Analytics

A BigQuery visualization dashboard with live polling feed, built with Next.js 14, Recharts, and Tailwind CSS.

## Features

- **SQL Query Editor** — write and run BigQuery SQL with Ctrl+Enter shortcut
- **4 Chart Types** — Line, Bar, Pie/Donut, and Data Table with pagination
- **Axis Configuration** — choose X/Y columns or name/value columns per chart type
- **Live Feed** — auto-polls BigQuery on a configurable interval (10s, 30s, 1m, 5m)
- **Saved Queries** — save and reload frequently used queries (stored in browser localStorage)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure BigQuery credentials

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

**Option A – Service account key file:**
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
BQ_PROJECT_ID=your-project-id
```

**Option B – Service account key as JSON string (good for deployment):**
```
BQ_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
BQ_PROJECT_ID=your-project-id
```

The service account needs the **BigQuery Data Viewer** and **BigQuery Job User** IAM roles.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Query & Explore tab
1. Write your SQL in the editor
2. Press **Run Query** or `Ctrl+Enter`
3. Switch between chart types and configure axes using the dropdowns above the chart
4. Save the query for later with the **Saved queries** button

### Live Feed tab
1. Write the SQL you want to poll
2. The chart auto-refreshes on your chosen interval
3. Use **Pause / Resume** to stop polling
4. Click **Refresh now** to manually trigger a fetch

## Deployment

The app can be deployed to Vercel, Cloud Run, or any Node.js host.
Set the environment variables in your host's dashboard instead of `.env.local`.
