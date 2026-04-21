# Module 11 — Freelancer Engagement & Gamification Backend
## WBS 3.1 · 3.2 · 3.3 Implementation

**Stack:** PERN (PostgreSQL · Express · React · Node.js)  
**Status:** WBS 3.0 complete — runs with dummy DB, ready to swap to real PostgreSQL

---

## What Is Implemented

| WBS Code | Feature | Status |
|----------|---------|--------|
| 3.1.1 | Leaderboard ranking algorithm (points + tiebreaker) | ✅ |
| 3.1.2 | Leaderboard API (weekly + all-time) | ✅ |
| 3.1.3 | In-memory cache with 5-min auto-refresh via cron | ✅ |
| 3.2.1 | Trust Score formula: `(AvgRating×20×0.6) + (CompletionRate×100×0.4)` | ✅ |
| 3.2.2 | Trust Score calculation + DB update on trigger | ✅ |
| 3.2.3 | Trust Score history tracking | ✅ |
| 3.2.4 | Trust Score API endpoint (for Module 1 to consume) | ✅ |
| 3.3.1 | Notification schema + 4 event types | ✅ |
| 3.3.2 | Internal notification queue & dispatcher | ✅ |
| 3.3.3 | Notification read/archive APIs | ✅ |

---

## Project Structure

```
module11-backend/
├── src/
│   ├── index.js                        ← Express app + cron job
│   ├── db/
│   │   ├── dummyData.js                ← Dummy DB (swap when real DB ready)
│   │   ├── pool.js                     ← PostgreSQL pool (pg library)
│   │   └── schema.sql                  ← Full DB schema + seed data
│   ├── middleware/
│   │   └── auth.js                     ← Stub auth (replace with JWT from Module 1)
│   ├── services/
│   │   ├── leaderboardService.js       ← WBS 3.1 logic
│   │   ├── trustScoreService.js        ← WBS 3.2 logic
│   │   └── notificationService.js      ← WBS 3.3 logic
│   ├── controllers/
│   │   ├── leaderboardController.js    ← WBS 3.1 HTTP handlers
│   │   ├── trustScoreController.js     ← WBS 3.2 HTTP handlers
│   │   └── notificationController.js   ← WBS 3.3 HTTP handlers
│   └── routes/
│       ├── leaderboard.js              ← WBS 3.1 routes
│       ├── trustScore.js               ← WBS 3.2 routes
│       └── notifications.js            ← WBS 3.3 routes
├── .env.example
├── package.json
└── README.md
```

---

## Step-by-Step Setup Instructions

### Step 1 — Prerequisites
Make sure the following are installed on your machine:
- **Node.js** v18 or higher → https://nodejs.org
- **npm** (comes with Node.js)
- **PostgreSQL** (only needed when switching off dummy DB)

To verify:
```bash
node --version   # should show v18+
npm --version
```

---

### Step 2 — Get the Code into Your Project

**Option A — If you received this as a zip:**
1. Unzip the file
2. Place the `module11-backend` folder inside your project root

**Option B — If using Git:**
```bash
# From the root of your repository
mkdir -p backend
cp -r module11-backend/ backend/
```

The recommended project layout is:
```
your-repo/
├── backend/
│   └── module11-backend/    ← this folder
└── frontend/                ← your React app (when ready)
```

---

### Step 3 — Install Dependencies

Open a terminal and run:
```bash
cd module11-backend
npm install
```

This installs: `express`, `pg`, `dotenv`, `cors`, `node-cron`, `nodemon`

---

### Step 4 — Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` — it looks like this:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamification_db
DB_USER=postgres
DB_PASSWORD=your_password_here
USE_DUMMY_DB=true     ← keep this true until your DB is ready
```

**Right now:** Leave `USE_DUMMY_DB=true`. The server will use in-memory data.

---

### Step 5 — Run the Server (Dummy DB Mode)

```bash
npm run dev
```

You will see:
```
================================================
  Module 11 Backend running on port 5000
  Mode: DUMMY DB
  Health: http://localhost:5000/health
================================================
```

The server is running. Open your browser or Postman and test:
- `GET http://localhost:5000/health`

---

### Step 6 — Test All Endpoints in Postman

Import the endpoints below into Postman (or test with curl).

#### WBS 3.1 — Leaderboard

```
GET  http://localhost:5000/api/leaderboard?period=all
GET  http://localhost:5000/api/leaderboard?period=weekly
GET  http://localhost:5000/api/leaderboard?period=all&limit=3
GET  http://localhost:5000/api/leaderboard/user/u001?period=all
POST http://localhost:5000/api/leaderboard/refresh
```

#### WBS 3.2 — Trust Score

```
GET  http://localhost:5000/api/user/u001/trust-score
GET  http://localhost:5000/api/user/u001/trust-score/history

POST http://localhost:5000/api/user/u001/trust-score/recalculate
Body (JSON):
{
  "avg_rating": 4.8,
  "completion_rate": 0.95
}
```

#### WBS 3.3 — Notifications

```
GET  http://localhost:5000/api/notifications/u001
GET  http://localhost:5000/api/notifications/u001?unread_only=true
GET  http://localhost:5000/api/notifications/u001/unread-count
PUT  http://localhost:5000/api/notifications/u001/n001/read
PUT  http://localhost:5000/api/notifications/u001/read-all

POST http://localhost:5000/api/notifications/send
Body (JSON):
{
  "user_id": "u001",
  "type": "badge",
  "message": "You earned the Challenge Master badge!"
}
```

Valid `type` values for notifications: `points` | `level` | `badge` | `challenge`

---

## Switching to Real PostgreSQL (When DB Is Ready)

### Step A — Create the database
```bash
psql -U postgres
CREATE DATABASE gamification_db;
\q
```

### Step B — Run the schema
```bash
psql -U postgres -d gamification_db -f src/db/schema.sql
```
This creates all tables and seeds 5 dummy users + 5 notifications.

### Step C — Update .env
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamification_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
USE_DUMMY_DB=false          ← change this to false
```

### Step D — Uncomment DB queries in each service
Search for `// [DB SWAP]` in these 3 files:
- `src/services/leaderboardService.js`
- `src/services/trustScoreService.js`
- `src/services/notificationService.js`

Each section shows the exact PostgreSQL query to uncomment.  
Delete or comment out the dummy block above each `[DB SWAP]` section.

### Step E — Restart
```bash
npm run dev
```

---

## Trust Score Formula Reference

```
TrustScore = (AvgRating × 20 × 0.6) + (CompletionRate × 100 × 0.4)
```

| Input | Range | Weight | Max Contribution |
|-------|-------|--------|-----------------|
| AvgRating (from Module 1) | 0–5 | 60% | 60 points |
| CompletionRate (from Module 3) | 0.0–1.0 | 40% | 40 points |
| **Final TrustScore** | **0–100** | | **100 points** |

Example: Rating=4.8, Completion=0.95  
`(4.8 × 20 × 0.6) + (0.95 × 100 × 0.4) = 57.6 + 38 = 95.6`

---

## Leaderboard Ranking Algorithm Reference

Sorting priority (per SRS REQ-22, REQ-23):
1. **total_points** — descending (higher = better rank)
2. **activity_count** — descending (tiebreaker: more active wins)
3. **created_at** — ascending (final tiebreaker: older member wins)

Example: Two users both have 1850 points.  
User A has 42 activities → Rank 2  
User B has 38 activities → Rank 3  

---

## How Other Modules Call These APIs

### Module 1 — User Profile display
```
GET /api/user/{freelancer_id}/trust-score
```
Returns trust score, level, avg_rating for profile display.

### Module 3 — Project completed event
```
POST /api/user/{freelancer_id}/trust-score/recalculate
Body: { "completion_rate": 0.95 }
```

### Module 1 — New rating posted
```
POST /api/user/{freelancer_id}/trust-score/recalculate
Body: { "avg_rating": 4.8 }
```

### Frontend (WBS 4.5) — Notification panel
```
GET /api/notifications/{user_id}
GET /api/notifications/{user_id}/unread-count
PUT /api/notifications/{user_id}/read-all
```

---

## SRS Requirements Satisfied

| Requirement | Endpoint / Logic |
|-------------|-----------------|
| REQ-22 Rank by total points | `leaderboardService.applyRankingAlgorithm()` |
| REQ-23 Activity tiebreaker | Sort step 2 in algorithm |
| REQ-24 Weekly leaderboard | `GET /api/leaderboard?period=weekly` |
| REQ-25 All-time leaderboard | `GET /api/leaderboard?period=all` |
| REQ-26 Dynamic update | 5-min cron + force-refresh endpoint |
| REQ-33 Score update on trigger | `POST /trust-score/recalculate` |
| REQ-34 Display trust score | `GET /trust-score` |
| REQ-35 Score range 0–100 | Clamp in `calculateTrustScore()` |
| REQ-36 Notify on key events | `notificationService.enqueueNotification()` |
| REQ-37 Store notifications | `persistNotification()` |
| REQ-38 Display notifications | `GET /api/notifications/:userId` |
| REQ-39 Mark as read | `PUT /api/notifications/:userId/:id/read` |
| REQ-40 Unread count | `GET /api/notifications/:userId/unread-count` |
| NFR-3 Leaderboard <3s | In-memory cache (WBS 3.1.3) |
| NFR-4 Notification <1s | Async queue dispatcher |
