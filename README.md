# QueueFree — Get a token, not a queue

A virtual queue system for clinics and salons: numbered tokens, a **live
departures board over Server-Sent Events**, and **wait-time predictions computed
from the counter's real service speed**.

---

## Problem Statement

People physically wait 40 minutes at clinics and salons just to be told "come
back later". Nobody knows how long the wait really is because it depends on the
counter's actual pace, not a posted schedule. QueueFree issues tokens, calls
the next person live, and predicts waits from measured service times.

## Target Users

- **Customers** who want to wait anywhere but the waiting room.
- **Counter staff** who need a simple call-next console with honest stats.
- **Clinic/salon owners** who want throughput data, not clipboard guesswork.

## Solution

Customers take a token (per-service daily numbering, e.g. A-14) and watch a
live board. Staff call next from a console; the state machine
(waiting → called → serving → done | no-show) records every transition. Each
completed visit contributes its measured duration to a rolling 10-sample
average, and predicted waits are `position × average ± σ·√position`.

## Key Features

- **Token state machine** — waiting/called/serving/done/no-show/cancelled with
  guarded transitions (only called tokens can no-show, etc.).
- **SSE live board** — `GET /api/queues/:id/stream` pushes full state on
  connect and on every mutation; heartbeats keep proxies happy.
- **ETA engine** — rolling average + standard deviation of the last 10 real
  service durations, widening uncertainty band with queue position.
- **No-show rejoin** — missed calls rejoin at the back with a tracked
  no-show count; auto-close of abandoned counter slots keeps stats honest.
- **Role separation** — customers join/watch; staff-only console and calls.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router 6, EventSource |
| Backend | Node.js, Express 4, Mongoose 8, Zod validation |
| Realtime | Server-Sent Events (native, no socket lib) + in-process pub/sub bus |
| Auth | JWT (7-day), bcryptjs, `customer`/`staff` roles, rate-limited auth |
| Database | MongoDB (Atlas or local); `USE_MEMORY_DB=1` zero-config demo |
| Tests | `node:test` + `mongodb-memory-server` (18 checks incl. ETA unit tests + SSE) |
| Deployment | Render (backend `render.yaml`) + Vercel (frontend `vercel.json`) |

## Architecture

```text
React SPA (Vercel)
   │  axios (mutations) + EventSource (live state)
   ▼
Express API (Render)
   │   /api/services           public live stats per counter
   │   /api/queues/:id/join    daily-numbered tokens, duplicate guard
   │   /api/queues/:id/me      position + predicted wait (band)
   │   /api/queues/:id/stream  SSE: state on connect + publish on mutation
   │   /api/staff/:id/next     call-next + auto-close previous w/ duration
   │   /api/staff/tokens/:id   complete | no-show (guarded)
   ▼
utils/eta.js — computeStats (rolling 10) + predictWait (σ·√n band)
utils/queueEvents.js — in-process EventEmitter bus for SSE fan-out
   ▼
MongoDB: User · Service (rolling stats) · Token (state machine)
```

## Major Workflows

1. **Take a token** — pick a service; daily numbering issues the next A-15.
   Duplicate active tokens are rejected (409).
2. **Watch live** — the board shows NOW SERVING, your position, and an ETA
   range that updates over SSE without refresh.
3. **Staff console** — call next (auto-closes the previous slot with its
   measured duration), complete visits, mark no-shows.
4. **Missed call → rejoin** — no-showed customers rejoin at the back with the
   same details; the no-show count is tracked.
5. **Throughput data** — every counter's average visit time and spread feed
   the ETAs everyone sees.

## Local Setup

```bash
# 1. Backend
cd backend
npm install
npm test                       # 18-check suite (no database needed)

# Zero-config demo:
USE_MEMORY_DB=1 npm start      # API on http://localhost:5106

# Or with a real MongoDB:
cp .env.example .env           # set MONGODB_URI + JWT_SECRET
npm run seed
npm start

# 2. Frontend
cd ../frontend
npm install
npm run dev                    # app on http://localhost:5306
```

**Demo credentials** (password `Demo@1234`): `counter@demo.com` (staff),
`priya@demo.com`, `arnav@demo.com`, `zoya@demo.com`, `imran@demo.com`
(customers). Seed: two counters (General OPD, Dental), 10 completed visits with
realistic durations, one called + three waiting, and a no-show to rejoin from.

## Environment Variables

### backend/.env

| Name | Purpose |
|---|---|
| `PORT` | API port (default 5106) |
| `MONGODB_URI` | MongoDB connection string (empty + `USE_MEMORY_DB=1` for demo mode) |
| `USE_MEMORY_DB` | `1` = ephemeral in-memory MongoDB, auto-seeded on boot |
| `JWT_SECRET` | Secret used to sign JWTs — long random string in production |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default http://localhost:5306) |

### frontend/.env

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (default http://localhost:5106/api) |

## API Overview

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Auth (customer/staff) |
| `GET /api/services` | Public per-counter live stats |
| `POST /api/queues/:serviceId/join` · `GET …/me` · `DELETE …/me` | Token lifecycle (customer) |
| `POST /api/queues/:serviceId/rejoin` | Rejoin after a no-show |
| `GET /api/queues/:serviceId/stream` | SSE live state stream |
| `POST /api/staff/:serviceId/next` · `GET …/console` | Counter console (staff) |
| `PATCH /api/staff/tokens/:id/complete` · `PATCH …/no-show` | Guarded transitions |
| `GET /api/health` | Health probe |

## Deployment

- **Backend**: Render web service from `backend/render.yaml`; set `MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_ORIGIN`; health check `/api/health`. SSE works on
  Render; set `headers: { connection: keep-alive }`-friendly timeouts if using
  a proxy.
- **Frontend**: Vercel from `frontend/` (SPA rewrite); set `VITE_API_URL`.

Live links: backend — [add URL] · frontend — [add URL]

## Error Handling & Security

- Zod validation; state-machine guards return 409 with human messages ("That
  token is not at the counter").
- Duplicate-token and self-conflict protection; role checks on every staff
  route; customers are query-scoped to their own tokens.
- bcrypt(12) hashing, no account enumeration, rate-limited auth, 7-day JWTs.
- Frontend shows live connectivity status, loading/empty/error states, and
  toasts on every mutation; 401 auto-logout.

- **Queue analytics** — tokens issued, served, no-show rate, average wait and hourly throughput per counter.

- **Garden stats** — watering streak, total litres given, and a rainwater-saved counter from every rain postponement.
- **Tip of the day** — rotating care tips on the dashboard.

## Roadmap

- SMS/WhatsApp "you're next" notifications.
- Multi-counter load balancing with joined queues.
- Kiosk mode with QR codes per counter.
- Historical throughput dashboards per day of week.
