# Module 11 — Freelancer Engagement & Gamification
## Full Stack Implementation (Backend + Frontend)

**Stack:** PERN (PostgreSQL · Express · React · Node.js + Vite)  
**Database:** PostgreSQL — `spm_platform`  
**Status:** Complete — Backend + Frontend running, all APIs verified

---

## Docker Images on Docker Hub
This project is containerized and available on Docker Hub:
- [Backend Image](https://hub.docker.com/r/manahilmanahil/spm-gamification-backend)
- [Frontend Image](https://hub.docker.com/r/manahilmanahil/spm-gamification-frontend)
- [PostgreSQL Image](https://hub.docker.com/r/manahilmanahil/spm-postgres)

### Quick Start with Docker
```bash
docker-compose up -d
```

---

## What Is Implemented

### Backend

| WBS Code | Feature | Status |
|----------|---------|--------|
| 2.1 | Points Award API (`POST /api/gamification/points/award`) | ✅ |
| 2.2.1 | Badge Definitions — 6 badges seeded on boot | ✅ |
| 2.2.2 | Badge Evaluation — auto-triggered after every point award | ✅ |
| 2.3.1 | Level Advancement — reads thresholds from DB (admin-configurable) | ✅ |
| 2.4 | Time-Based Challenges — daily / weekly / monthly (20 challenges) | ✅ |
| 2.4.4 | Stale challenge expiry via hourly cron job | ✅ |
| 2.5.3 | Admin Badge/Challenge/Level Config API | ✅ |
| 3.1.1 | Leaderboard ranking algorithm (points + activity tiebreaker) | ✅ |
| 3.1.2 | Leaderboard API (weekly + all-time) | ✅ |
| 3.1.3 | In-memory cache with 5-min auto-refresh via cron | ✅ |
| 3.2.1 | Trust Score formula | ✅ |
| 3.2.2 | Trust Score calculation + DB update | ✅ |
| 3.2.4 | Trust Score API endpoint | ✅ |
| 3.3.1 | Notification schema + 4 event types | ✅ |
| 3.3.2 | Notification dispatcher | ✅ |
| 3.3.3 | Notification read/delete APIs | ✅ |
| 4.2 | Gamified Onboarding — 5 onboarding challenges seeded | ✅ |
| 5.1 | User Profile API (for cross-module data sharing) | ✅ |

### Frontend

| Page | Features | Status |
|------|---------|--------|
| Achievements Page | 3 tabs: Badges, Levels, Challenges | ✅ |
| Achievements — Badges Tab | View badge definitions, Admin: add/edit/delete | ✅ |
| Achievements — Levels Tab | View XP thresholds, Admin: edit min/max XP and title | ✅ |
| Achievements — Challenges Tab | View all challenges with filters, Admin: add/edit/delete | ✅ |
| Leaderboard Page | Podium (top 3) + full rankings table, Weekly/All-Time toggle | ✅ |
| Notifications | Bell icon with unread count, panel with mark-read and delete | ✅ |
| Navbar | Active page highlighted, navigation between Leaderboard and Achievements | ✅ |

---

## Project Structure

```
SPM-Freelancer-Gamification-and-Engagement-Ecosystem/
├── src/
│   ├── index.js                        ← Express app entry point + cron jobs
│   ├── db/
│   │   └── pool.js                     ← PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js                     ← requireUserId, requireAdmin middleware
│   ├── routes/
│   │   ├── gamification.js             ← Points, badges, user profile routes
│   │   ├── adminConfig.js              ← Admin CRUD for badges, levels, challenges
│   │   ├── challenges.js               ← Timed challenge routes
│   │   ├── leaderboard.js              ← Leaderboard routes
│   │   ├── trustScore.js               ← Trust score routes
│   │   └── notifications.js            ← Notification routes
│   └── services/
│       ├── gamificationService.js      ← awardPoints, evaluateBadges, getUserProfile
│       ├── badgeService.js             ← Badge + challenge seeders, BADGE_DEFINITIONS
│       ├── challengeService.js         ← Challenge progress tracking, expiry
│       ├── leaderboardService.js       ← Leaderboard ranking + cache
│       ├── trustScoreService.js        ← Trust score calculation
│       └── notificationService.js      ← Notification creation + dispatch
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     ← Hash-based router (#leaderboard, #achievements)
│   │   └── pages/
│   │       ├── AchievementsPage.jsx    ← Badges | Levels | Challenges tabs
│   │       └── LeaderboardPage.jsx     ← Leaderboard with podium + table
│   └── vite.config.js                  ← Proxies /api/* to localhost:5000
├── SPM_Centralized_Db.sql              ← Main database schema (from integration team)
├── module11_seed.sql                   ← Module 11 seed data
├── Module#11_Queries                   ← SQL queries reference for Module 11
├── Dockerfile                          ← Backend Docker image definition
├── Dockerfile.frontend                 ← Frontend Docker image definition
├── docker-compose.yml                  ← Multi-container orchestration (backend + frontend + postgres)
├── nginx.conf                          ← Nginx reverse proxy config for frontend container
├── .dockerignore                       ← Files excluded from Docker build context
├── .gitignore                          ← Files excluded from Git (includes .env files)
├── test-api.bat                        ← Windows batch script to test all API endpoints
├── package.json
└── README.md
```

> ⚠ `.env` files are **not included in the repository**. Create them locally — see Steps 3 and 6 below.

---

## Step-by-Step Setup Instructions

### Step 1 — Prerequisites

Make sure the following are installed:
- **Node.js** v18 or higher → https://nodejs.org
- **PostgreSQL** with database `spm_platform` created
- **pgAdmin** (optional, for DB inspection)

```bash
node --version   # should show v18+
npm --version
```

---

### Step 2 — Backend Setup

```bash
# Navigate to project root
cd SPM-Freelancer-Gamification-and-Engagement-Ecosystem

# Install backend dependencies
npm install
```

---

### Step 3 — Backend Environment

Create a `.env` file in the project root (this file is excluded from the repo — do not commit it):

```env
PORT=5000
USE_DUMMY_DB=false

DB_HOST=localhost
DB_PORT=5432
DB_NAME=spm_platform
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

> ⚠ `.env` is listed in `.gitignore` and must never be committed to the repository. Each team member creates their own local `.env` file.

---

### Step 4 — Database Setup

**Step 4a** — Run the main schema first (from integration team):
```bash
psql -U postgres -d spm_platform -f SPM_Centralized_Db.sql
```

**Step 4b** — Run the Module 11 seed file:
```bash
psql -U postgres -d spm_platform -f module11_seed.sql
```

This seeds:
- 3 level definitions (Beginner / Intermediate / Advanced)
- 6 badge definitions
- 20 challenges (5 onboarding, 5 daily, 5 weekly, 5 monthly)
- 6 test users with progress, badges, and notifications

---

### Step 5 — Run the Backend

```bash
npm run dev
```

You will see:
```
================================================
  Module 11 Backend running on port 5000
  Mode: PostgreSQL
  Health: http://localhost:5000/health
================================================
[Badge Seeder] All 6 badges seeded.
[Challenge Seeder] All 5 onboarding challenges seeded.
[Challenge Seeder] 15 timed challenges seeded (daily/weekly/monthly).
```

---

### Step 6 — Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (also excluded from repo — do not commit):
```env
VITE_USER_ID=1
VITE_API_BASE=
```

> ⚠ `frontend/.env` is also in `.gitignore`. Each team member creates their own locally.

---

### Step 7 — Run the Frontend

```bash
# In the frontend/ folder
npm run dev
```

Frontend runs at: `http://localhost:5173`

| Page | URL |
|------|-----|
| Leaderboard | http://localhost:5173/#leaderboard |
| Achievements | http://localhost:5173/#achievements |
| Onboarding   | http://localhost:5173/#onboarding   |

For onboarding , press F12 and run this command:
localStorage.setItem ('userId',4)
then do setup in db

----Leaderboard Page----
The leaderboard ranks all users by their gamification points. It has two modes toggled by a button:

Weekly — ranks users by points earned in the current week
All-Time — ranks users by their total accumulated points ever

The layout has two parts: a podium that highlights the top 3 users visually, and a full rankings table below showing everyone else. Ties are broken first by activity_count (more active user wins), then by created_at (older account wins).
The data is cached in memory and auto-refreshes every 5 minutes via a cron job, so it's fast. There's also a POST /api/leaderboard/refresh endpoint to force a manual refresh if needed.

-------Achievements Page-------
This page has three tabs:
Badges Tab — shows all 6 badge definitions. Badges are earned automatically whenever you hit a condition (e.g. reaching 1000 points earns Rising Star, completing 3 challenges earns Challenge Master). Admins can add, edit, or delete badges from this tab.

Levels Tab — shows the three XP levels: Beginner (0–500), Intermediate (501–15,000), and Advanced (15,001+). Admins can edit the XP thresholds and titles directly from this tab, and the changes take effect immediately since levels are read from the DB rather than hardcoded.

Challenges Tab — shows all 20 challenges across four types: 5 onboarding, 5 daily, 5 weekly, and 5 monthly. You can filter by type. Challenge progress is updated automatically every time a relevant action_type is awarded points — for example, submitting a bid advances DAILY_02, WEEKLY_01, MONTHLY_03, and ONBOARD_04 simultaneously. Admins can add, edit, or delete challenges here too.

---

## All API Endpoints

### Auth Headers (required on all requests)
```
x-user-id: <user_id>
x-user-role: admin        ← only needed for admin write operations
```

---

### WBS 2.1 — Points Award
```
POST /api/gamification/points/award
Body: { "user_id": 1, "action_type": "login", "points": 10 }
```
Automatically:
- Awards points to user
- Evaluates badge conditions
- Updates challenge progress
- Triggers level-up if threshold crossed
- Creates notifications for badge/level events
- Auto-creates gamification row if user is new

---

### WBS 2.2 — Badge APIs
```
GET  /api/gamification/admin/badges              ← all badge definitions
POST /api/gamification/admin/badges              ← add badge (admin)
PATCH /api/gamification/admin/badges/:code       ← edit badge (admin)
DELETE /api/gamification/admin/badges/:code      ← delete badge permanently (admin)
GET  /api/gamification/user/:id/badges           ← earned badges for a user
```

---

### WBS 2.3 — Level APIs
```
GET /api/gamification/admin/level-thresholds     ← all level definitions
PUT /api/gamification/admin/level-thresholds     ← edit level XP thresholds (admin)
Body: { "level_number": 2, "min_points": 501, "max_points": 15000, "title": "Intermediate" }
```

---

### WBS 2.4 — Challenge APIs
```
GET    /api/gamification/admin/challenges         ← all challenge definitions
POST   /api/gamification/admin/challenges         ← add challenge (admin)
PUT    /api/gamification/admin/challenges/:id     ← edit challenge (admin)
DELETE /api/gamification/admin/challenges/:id     ← delete challenge permanently (admin)
GET    /api/gamification/user/:id/challenges      ← user's active challenge progress
```

---

### WBS 3.1 — Leaderboard
```
GET  /api/leaderboard?period=weekly&limit=50     ← weekly leaderboard
GET  /api/leaderboard?period=all&limit=50        ← all-time leaderboard
POST /api/leaderboard/refresh                    ← force cache refresh
```

---

### WBS 3.2 — Trust Score
```
GET  /api/user/:id/trust-score                   ← calculate + return trust score
POST /api/user/:id/trust-score/recalculate       ← recalculate with new inputs
Body: { "avg_rating": 4.8, "completion_rate": 0.95 }
```

---

### WBS 3.3 — Notifications
```
GET  /api/notifications/:userId                  ← all notifications
GET  /api/notifications/:userId/unread-count     ← unread count
PUT  /api/notifications/:userId/:id/read         ← mark one as read
PUT  /api/notifications/:userId/read-all         ← mark all as read
DELETE /api/notifications/:userId/:id            ← delete notification
```

---

### WBS 5.1 — User Profile (Cross-Module API)
```
GET /api/gamification/user/:id/profile
```
Returns:
```json
{
  "userId": 1,
  "total_points": 2210,
  "current_level": 2,
  "activity_count": 24,
  "avg_rating": "4.70",
  "completion_rate": "0.8500",
  "trust_score": "90.40",
  "top_badges": [
    { "badge_code": "TOP_RATED", "name": "Top Rated", "unlocked_at": "..." },
    { "badge_code": "RISING_STAR", "name": "Rising Star", "unlocked_at": "..." },
    { "badge_code": "CONSISTENT_PERFORMER", "name": "Consistent Performer", "unlocked_at": "..." }
  ]
}
```

---

### User Registration (call from Module 1)
```
POST /api/gamification/user/register
Body: { "user_id": <new_user_id> }
```
Call this immediately after creating a new user so they appear on the leaderboard.

---

## How Other Modules Integrate

### Module 1 — After user registers
```
POST /api/gamification/user/register
Body: { "user_id": <new_user_id> }
```

### Module 1 — After rating is posted
```
POST /api/gamification/points/award
Body: { "user_id": <id>, "action_type": "five_star_rating", "points": 20 }
```

### Module 3 — After project completed
```
POST /api/gamification/points/award
Body: { "user_id": <id>, "action_type": "project_completed", "points": 50 }
```

### Module 3 — After milestone delivered
```
POST /api/gamification/points/award
Body: { "user_id": <id>, "action_type": "milestone_completed", "points": 30 }
```

### Module 8 — After dispute resolved
```
POST /api/gamification/points/award
Body: { "user_id": <id>, "action_type": "dispute_resolved", "points": 10 }
```

### Any module — To get user profile data
```
GET /api/gamification/user/:id/profile
```

---

## Action Types Reference

These are the `action_type` values that trigger challenge progress:

| action_type | Triggered by | Challenges |
|---|---|---|
| `login` | Module 1 on login | DAILY_01, WEEKLY_03 |
| `bid_submitted` | Module 3 on bid | DAILY_02, WEEKLY_01, MONTHLY_03, ONBOARD_04 |
| `message_sent` | Module 6 on message | DAILY_03 |
| `availability_updated` | Module 1 | DAILY_04 |
| `review_submitted` | Module 8 | DAILY_05 |
| `milestone_completed` | Module 3 | WEEKLY_02 |
| `portfolio_upload` | Module 1 | WEEKLY_04, ONBOARD_02 |
| `five_star_rating` | Module 8 | WEEKLY_05 |
| `project_completed` | Module 3 | MONTHLY_01 |
| `profile_complete` | Module 1 | ONBOARD_01 |
| `skill_added` | Module 1 | ONBOARD_03 |
| `identity_verified` | Module 1 | ONBOARD_05 |

---

## Badge Earning Conditions

| Badge | Condition | Bonus Points |
|---|---|---|
| FIRST_PROJECT | completed_projects >= 1 | +100 |
| RISING_STAR | total_points >= 1000 | +150 |
| CONSISTENT_PERFORMER | activity_count >= 10 | +100 |
| TOP_RATED | avg_rating >= 4.5 | +200 |
| CHALLENGE_MASTER | completed_challenges >= 3 | +200 |
| ONBOARDING_COMPLETE | all 5 ONBOARD challenges done | +50 |

Badges are evaluated automatically after every `POST /api/gamification/points/award` call.

---

## Level Thresholds (Admin-Configurable)

| Level | Title | XP Range |
|---|---|---|
| 1 | Beginner | 0 – 500 |
| 2 | Intermediate | 501 – 15,000 |
| 3 | Advanced | 15,001+ |

Admins can update these from the **📈 Levels tab** in the Achievements page.

---

## Trust Score Formula

```
TrustScore = (avg_rating / 5.0 × 40) + (activity_count / 100 × 30) + (completion_rate × 30)
```

| Input | Source | Max Contribution |
|---|---|---|
| avg_rating (0–5) | Module 1 / Module 8 | 40 points |
| activity_count (0–100 capped) | Module 11 | 30 points |
| completion_rate (0.0–1.0) | Module 3 | 30 points |
| **Total** | | **100 points** |

---

## Leaderboard Ranking Algorithm

Sorting priority:
1. `total_points` — descending
2. `activity_count` — descending (tiebreaker)
3. `created_at` — ascending (oldest member wins final tie)