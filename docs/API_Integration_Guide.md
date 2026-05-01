# Module 11 — API Integration Guide
## For Modules 1, 3, 9, and 13 (Integration Layer)
**WBS 5.2.3 — Write API Integration Guide**

Version: 1.0 | Date: April 2026

---

## Overview

This guide explains how each dependent module should integrate with Module 11's REST API. Read only the section for your module.

**Module 11 Base URL:** `http://localhost:5000` (development)
Contact Module 11 lead for the production/demo URL.

---

## For Module 13 — Integration Layer

You are responsible for routing API calls between all modules. Below are all Module 11 endpoints you need to register.

### All Module 11 Endpoints to Register

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/leaderboard` | Leaderboard (all-time or weekly) |
| GET | `/api/leaderboard/week/:weekStart` | Historical week leaderboard |
| GET | `/api/leaderboard/user/:userId` | User's current rank |
| POST | `/api/leaderboard/refresh` | Force cache refresh |
| GET | `/api/user/:userId/trust-score` | User's trust score |
| POST | `/api/user/:userId/trust-score/recalculate` | Trigger recalculation |
| GET | `/api/user/:userId/trust-score/history` | Score history |
| GET | `/api/notifications/:userId` | User notifications |
| GET | `/api/notifications/:userId/unread-count` | Unread count |
| PUT | `/api/notifications/:userId/:notifId/read` | Mark one read |
| PUT | `/api/notifications/:userId/read-all` | Mark all read |
| POST | `/api/notifications/send` | Send notification |

### Authentication Header Convention

All requests to Module 11 must include:

```
x-user-id: <user_id>
```

For admin-gated operations, also include:

```
x-user-role: admin
```

### Error Forwarding

Module 11 returns standard JSON errors. Forward them as-is to the requesting module:

```json
{ "success": false, "error": "description" }
```

HTTP status codes are standard (200, 400, 404, 500) — forward these too.

---

## For Module 1 — User Identity & Profile

You need two things from Module 11: the trust score for profile display, and the ability to trigger recalculation when a new rating is posted.

### Step 1 — Display Trust Score on Freelancer Profile

When rendering a freelancer's profile page, call:

```
GET /api/user/{freelancer_user_id}/trust-score
```

**Example Request (from your backend)**
```javascript
const response = await fetch(`http://localhost:5000/api/user/${freelancerId}/trust-score`, {
  headers: { 'x-user-id': requestingUserId }
});
const data = await response.json();

// data.trust_score  → number 0–100, display as "Trust Score: 95.6 / 100"
// data.avg_rating   → the rating component (for reference)
// data.completion_rate → the completion component (for reference)
```

**What you receive:**
```json
{
  "success": true,
  "user_id": "u001",
  "name": "Ali Hassan",
  "trust_score": 95.6,
  "avg_rating": 4.8,
  "completion_rate": 0.95
}
```

Display `trust_score` prominently on the profile. The value is always between 0 and 100.

---

### Step 2 — Trigger Recalculation When a New Rating is Posted

After a client submits a rating for a freelancer, notify Module 11 so it can update the trust score:

```
POST /api/user/{freelancer_user_id}/trust-score/recalculate
Body: { "avg_rating": <new_average_rating> }
```

**Example Request**
```javascript
// After saving the new rating in your own DB:
const newAvgRating = calculateNewAverage(existingRatings, newRating);

await fetch(`http://localhost:5000/api/user/${freelancerId}/trust-score/recalculate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': freelancerId
  },
  body: JSON.stringify({ avg_rating: newAvgRating })
});
```

Send `avg_rating` as a float between 0.0 and 5.0. Module 11 will keep the existing `completion_rate` unchanged.

You do not need to wait for the response before continuing — fire and move on.

---

### Step 3 — (Optional) Display User Level and Badges

Module 11 also exposes the user's leaderboard rank. You may display it on the profile:

```
GET /api/leaderboard/user/{freelancer_user_id}?period=all
```

Returns the user's rank, total points, and level — useful for profile badges and rankings display.

---

## For Module 3 — Project & Gig Marketplace

When a freelancer completes a project, you need to notify Module 11 so it can update the trust score.

### Trigger Trust Score Recalculation on Project Completion

After marking a project as complete in your system, call:

```
POST /api/user/{freelancer_user_id}/trust-score/recalculate
Body: { "completion_rate": <new_completion_rate> }
```

**How to calculate `completion_rate`:**
```
completion_rate = completed_projects / total_accepted_projects
```

This is a float between 0.0 (0% completion) and 1.0 (100% completion).

**Example Request**
```javascript
// After marking project complete:
const completionRate = completedCount / totalCount; // e.g. 19/20 = 0.95

await fetch(`http://localhost:5000/api/user/${freelancerId}/trust-score/recalculate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': freelancerId
  },
  body: JSON.stringify({ completion_rate: completionRate })
});
```

Send `completion_rate` as a float between 0.0 and 1.0. Module 11 will keep the existing `avg_rating` unchanged.

This is a fire-and-forget call — you do not need to wait for the response.

---

### Project Completion Event — Field Contract

| Field | Type | Range | Required | Description |
|---|---|---|---|---|
| `completion_rate` | float | 0.0–1.0 | Yes | Ratio of completed to total accepted projects |

Do not send `avg_rating` in this call — that is Module 1's responsibility.

---

## For Module 9 — Analytics & Governance

Module 11 generates engagement data that is valuable for your analytics dashboards. You can pull this data from two endpoints.

### Pull Leaderboard Data for Analytics

```
GET /api/leaderboard?period=all
GET /api/leaderboard?period=weekly
```

Both return ranked user lists with `total_points` and `activity_count` — useful for platform engagement metrics.

### Pull Historical Weekly Data

To track engagement trends week by week, use:

```
GET /api/leaderboard/week/{weekStart}
```

Where `weekStart` is the Monday of the target week in `YYYY-MM-DD` format.

**Example — fetch last week's data for analytics:**
```javascript
// Calculate last Monday
const lastMonday = getLastMonday(); // your date utility

const response = await fetch(`http://localhost:5000/api/leaderboard/week/${lastMonday}`);
const data = await response.json();

// data.data → array of { user_id, name, points_for_rank, activity_count }
// Use this to track weekly active users and engagement trends
```

### Activity Log Schema Module 11 Expects from You

Module 11 uses activity logs (from Module 9) to populate `activity_count` for the leaderboard tiebreaker and for streak-based challenges. The expected event structure:

| Field | Type | Description |
|---|---|---|
| `user_id` | string | The acting user's ID |
| `action_type` | string | Type of action (e.g. `project_submitted`, `bid_placed`) |
| `timestamp` | ISO 8601 string | When the action occurred |

Agree on this schema with the Module 11 lead (Maryam Fatima) by end of Week 2.

---

## Common Integration Mistakes — What NOT to Do

**1. Sending wrong data types**
```json
// WRONG — string instead of number
{ "avg_rating": "4.8" }

// CORRECT
{ "avg_rating": 4.8 }
```

**2. Sending completion_rate as a percentage**
```json
// WRONG — percentage not decimal
{ "completion_rate": 95 }

// CORRECT — decimal fraction
{ "completion_rate": 0.95 }
```

**3. Sending avg_rating outside 0–5**
```json
// WRONG — out of range
{ "avg_rating": 4.8 }   // fine
{ "avg_rating": 9.6 }   // ERROR — Module 1 must average properly
```

**4. Calling wrong period for weekly board**
```
// WRONG
GET /api/leaderboard?period=weekly&limit=10

// If you want all-time, use:
GET /api/leaderboard?period=all
```

**5. Not including Content-Type for POST/PUT**
```
// All POST/PUT must include:
Content-Type: application/json
```

---

## Integration Test Checklist

Use this before Week 7 integration testing:

**Module 1:**
- [ ] `GET /api/user/{id}/trust-score` returns a number between 0 and 100
- [ ] `POST /api/user/{id}/trust-score/recalculate` with `avg_rating` returns updated score
- [ ] Trust score displays correctly on the freelancer profile page in your UI

**Module 3:**
- [ ] `POST /api/user/{id}/trust-score/recalculate` with `completion_rate` returns updated score
- [ ] Recalculation is triggered on every project completion event

**Module 9:**
- [ ] `GET /api/leaderboard?period=weekly` returns current week data
- [ ] `GET /api/leaderboard/week/{weekStart}` returns historical week data correctly

**Module 13:**
- [ ] All 12 endpoints are registered and routable
- [ ] Error responses (400, 404, 500) are forwarded correctly
- [ ] `x-user-id` header is passed through in all proxied requests

---

## Contact

| Role | Name | Contact |
|---|---|---|
| Module 11 Lead (Backend/Integration) | Maryam Fatima | i233007@isb.nu.edu.pk |
| Module 11 Backend Lead | Zainab Naeem | i230065@isb.nu.edu.pk |
| Module 11 Team Lead | Manahil | i233000@isb.nu.edu.pk |

For urgent integration issues during Week 7, contact the WhatsApp group directly.
