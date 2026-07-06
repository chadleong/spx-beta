# SPX Beta Dashboard

A live dashboard tracking the **21-day rolling beta of SPX returns vs 10-year Treasury yield changes** — visualising how equities respond to rate moves over time.

![chart shows green segments for positive beta, red for negative]

## What it shows

- **Rolling beta** (default 21-day window) calculated as `cov(SPX returns, ΔYield) / var(ΔYield)`
- **SPX returns** expressed in % (×100) so beta units read as: *% SPX move per 1pp yield change*
- **Positive beta** (green) → equities and yields moving together
- **Negative beta** (red) → equities and yields moving in opposite directions
- **21-day trend arrow** showing whether beta is rising or falling vs 21 sessions ago
- Falls back to synthetic data (correlated OU process) if Yahoo Finance is unavailable

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · Flask · yfinance · pandas · numpy |
| Frontend | React 18 · TypeScript · Vite · Chart.js 4 |

## Quick start

```bash
# Clone
git clone https://github.com/chadleong/spx-beta.git
cd spx-beta

# Backend
python -m venv env
source env/bin/activate        # Windows: env\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/app.py          # → http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                    # → http://localhost:4000
```

Or use the included shell script to start both at once:

```bash
bash start.sh
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/rolling-beta` | Returns full beta time series |
| `GET /api/rolling-beta?window=42` | Custom window (5–252 days) |
| `GET /api/rolling-beta?synthetic=true` | Force synthetic data |
| `GET /api/health` | Health check |

On startup, `app.py` also writes the computed data to `backend/data/rolling_beta.json`.

## Data sources

- **^GSPC** — S&P 500 daily close (Yahoo Finance)
- **^TNX** — 10-Year Treasury yield daily close (Yahoo Finance)
