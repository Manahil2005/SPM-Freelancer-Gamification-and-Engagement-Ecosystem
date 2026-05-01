# Module 11 — API Documentation
## Freelancer Engagement & Gamification Ecosystem
**WBS 5.2.2 — Document All APIs with Request/Response Examples**

Version: 1.0 | Date: April 2026 | Team: Semicolon (FAST NUCES Islamabad)

---

## Base URL

```
http://localhost:5000
```

> For integration, replace with the deployed server URL agreed with Module 13 (Integration Layer).

---

## General Conventions

| Convention | Detail |
|---|---|
| Data format | JSON only — all requests and responses |
| Content-Type | `application/json` for all POST/PUT requests |
| Authentication | Pass `x-user-id` header (stub — will be replaced with JWT from Module 1) |
| Admin role | Pass `x-user-role: admin` header for admin-gated endpoints |
| Success shape | `{ "success": true, ...data }` |
| Error shape | `{ "success": false, "error": "message" }` |
| HTTP status codes | Standard: 200 OK, 202 Accepted, 400 Bad Request, 404 Not Found, 500 Server Error |

---

## Error Response Format

All errors return this structure:

```json
{
  "success": false,
  "error": "Human-readable error description"
}
```

| Status | Meaning |
|---|---|
| 400 | Invalid input — check request body or query params |
| 404 | Resource not found (user ID, notification ID) |
| 500 | Unexpected server error |

---

## Endpoints

---

### Health Check

#### `GET /health`

Verify the server is running.

**Response `200`**
```json
{
  "status": "ok",
  "module": "Module 11 — Freelancer Engagement & Gamification",
  "mode": "DUMMY DB",
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

---

## WBS 3.1 — Leaderboard Engine

> SRS Requirements: REQ-22, REQ-23, REQ-24, REQ-25, REQ-26, NFR-3

**Ranking Algorithm:**
1. `points_for_rank` DESC — primary sort
2. `activity_count` DESC — tiebreaker (REQ-23)
3. `created_at` ASC — final tiebreaker (oldest member wins)

**Two Board Types:**
- **All-time** — ranks on `total_points` (lifetime accumulated)
- **Weekly** — ranks on `points_earned` in the current ISO week only (Monday–Sunday)

---

#### `GET /api/leaderboard`

Returns the ranked leaderboard.

**Query Parameters**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `period` | string | No | `all` | `all` (all-time) or `weekly` (current week only) |
| `limit` | integer | No | `50` | Max results. Range: 1–100 |

**Request**
```
GET /api/leaderboard?period=weekly&limit=10
```

**Response `200` — Weekly**
```json
{
  "success": true,
  "period": "weekly",
  "week_start": "2026-04-20",
  "count": 5,
  "lastRefreshed": "2026-04-22T10:00:00.000Z",
  "data": [
    {
      "rank": 1,
      "user_id": "u003",
      "name": "Raza Khan",
      "level": 3,
      "total_points": 3200,
      "points_for_rank": 890,
      "activity_count": 23
    },
    {
      "rank": 2,
      "user_id": "u002",
      "name": "Sana Mir",
      "level": 2,
      "total_points": 1850,
      "points_for_rank": 410,
      "activity_count": 11
    }
  ]
}
```

> `points_for_rank` = points earned THIS week (for weekly) or total_points (for all).
> `total_points` is always the all-time total and shown for display purposes on both boards.

**Response `200` — All-time**
```json
{
  "success": true,
  "period": "all",
  "week_start": null,
  "count": 5,
  "lastRefreshed": "2026-04-22T10:00:00.000Z",
  "data": [
    {
      "rank": 1,
      "user_id": "u003",
      "name": "Raza Khan",
      "level": 3,
      "total_points": 3200,
      "points_for_rank": 3200,
      "activity_count": 91
    }
  ]
}
```

**Response `400` — Invalid period**
```json
{
  "success": false,
  "error": "Invalid period \"monthly\". Use \"weekly\" or \"all\"."
}
```

---

#### `GET /api/leaderboard/week/:weekStart`

Returns the leaderboard for a specific historical week.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `weekStart` | string | Yes | Monday of target week in `YYYY-MM-DD` format |

**Request**
```
GET /api/leaderboard/week/2026-04-13
```

**Response `200`**
```json
{
  "success": true,
  "period": "weekly",
  "week_start": "2026-04-13",
  "count": 4,
  "data": [
    {
      "rank": 1,
      "user_id": "u003",
      "name": "Raza Khan",
      "level": 3,
      "total_points": 3200,
      "points_for_rank": 950,
      "activity_count": 25
    }
  ]
}
```

**Response `400` — Invalid format**
```json
{
  "success": false,
  "error": "weekStart must be in YYYY-MM-DD format (Monday of the target week)."
}
```

---

#### `GET /api/leaderboard/user/:userId`

Returns a specific user's rank on the leaderboard.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | User ID |

**Query Parameters**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `period` | string | No | `all` | `all` or `weekly` |

**Request**
```
GET /api/leaderboard/user/u001?period=weekly
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "period": "weekly",
  "rank": 3,
  "name": "Ali Hassan",
  "level": 2,
  "total_points": 1850,
  "points_for_rank": 320,
  "activity_count": 8
}
```

**Response `200` — User not on board**
```json
{
  "success": true,
  "user_id": "u001",
  "period": "weekly",
  "rank": null,
  "message": "User not found in leaderboard."
}
```

---

#### `POST /api/leaderboard/refresh`

Force-refresh the leaderboard in-memory cache immediately.
Normally refreshes automatically every 5 minutes via cron job.

**Request** — No body required

**Response `200`**
```json
{
  "success": true,
  "message": "Leaderboard cache refreshed."
}
```

---

## WBS 3.2 — Trust Score Engine

> SRS Requirements: REQ-32, REQ-33, REQ-34, REQ-35

**Formula:**
```
TrustScore = (AvgRating × 20 × 0.6) + (CompletionRate × 100 × 0.4)
```

| Component | Input Range | Weight | Max Contribution |
|---|---|---|---|
| AvgRating (from Module 1) | 0–5 | 60% | 60 points |
| CompletionRate (from Module 3) | 0.0–1.0 | 40% | 40 points |
| **Final TrustScore** | **0–100** | | **100 points** |

Range enforced at two levels:
- Application layer: clamped with `Math.min(100, Math.max(0, raw))`
- Database layer: `CHECK (trust_score >= 0 AND trust_score <= 100)`

---

#### `GET /api/user/:userId/trust-score`

Returns the current trust score for a user. Auto-computes on first call if not yet calculated.

> **Module 1 calls this** to display Trust Score on the freelancer profile page.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | User ID |

**Request**
```
GET /api/user/u001/trust-score
```

**Response `200`**
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

**Response `404`**
```json
{
  "success": false,
  "error": "User \"u999\" not found."
}
```

---

#### `POST /api/user/:userId/trust-score/recalculate`

Trigger recalculation of a user's trust score. Called by external modules when their data changes.

> **Module 1 calls this** when a new client rating is posted.
> **Module 3 calls this** when a project is marked complete.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | User ID |

**Request Body** — all fields optional

| Field | Type | Range | Description |
|---|---|---|---|
| `avg_rating` | number | 0.0–5.0 | New average rating from Module 1 |
| `completion_rate` | number | 0.0–1.0 | New completion rate from Module 3 |

**Example — Module 1 (new rating)**
```json
{
  "avg_rating": 4.8
}
```

**Example — Module 3 (project completed)**
```json
{
  "completion_rate": 0.96
}
```

**Example — both updated together**
```json
{
  "avg_rating": 4.8,
  "completion_rate": 0.96
}
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "old_trust_score": 90.4,
  "new_trust_score": 95.6,
  "avg_rating": 4.8,
  "completion_rate": 0.95,
  "formula": "(4.8 × 20 × 0.6) + (0.95 × 100 × 0.4) = 95.6"
}
```

**Response `400` — avg_rating out of range**
```json
{
  "success": false,
  "error": "avg_rating must be between 0 and 5."
}
```

**Response `400` — completion_rate out of range**
```json
{
  "success": false,
  "error": "completion_rate must be between 0.0 and 1.0."
}
```

---

#### `GET /api/user/:userId/trust-score/history`

Returns all historical trust score entries for a user, most recent first.

**Request**
```
GET /api/user/u001/trust-score/history
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "count": 2,
  "history": [
    {
      "trust_score": 95.6,
      "avg_rating": 4.8,
      "completion_rate": 0.95,
      "calculated_at": "2026-04-22T10:05:00.000Z"
    },
    {
      "trust_score": 90.4,
      "avg_rating": 4.5,
      "completion_rate": 0.95,
      "calculated_at": "2026-04-21T09:00:00.000Z"
    }
  ]
}
```

---

## WBS 3.3 — Notification Service

> SRS Requirements: REQ-36, REQ-37, REQ-38, REQ-39, REQ-40, NFR-4

**4 Event Types (per SRS 4.8.1):**

| Type | Trigger |
|---|---|
| `points` | User earns points for any action |
| `level` | User advances to a new level |
| `badge` | User earns a badge |
| `challenge` | New challenge available or challenge completed |

**Delivery:** Async queue — non-blocking, dispatched within 1 second (NFR-4).

---

#### `GET /api/notifications/:userId`

Returns notifications for a user.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | User ID |

**Query Parameters**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `unread_only` | boolean | No | `false` | If `true`, returns only unread notifications |
| `limit` | integer | No | `20` | Max results. Range: 1–100 |

**Request — all notifications**
```
GET /api/notifications/u001
```

**Request — unread only**
```
GET /api/notifications/u001?unread_only=true
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "unread_count": 2,
  "count": 3,
  "notifications": [
    {
      "notification_id": "n001",
      "user_id": "u001",
      "type": "points",
      "message": "You earned 50 points for completing a project!",
      "is_read": false,
      "created_at": "2026-04-22T09:30:00.000Z"
    },
    {
      "notification_id": "n002",
      "user_id": "u001",
      "type": "badge",
      "message": "Congratulations! You earned the Rising Star badge!",
      "is_read": false,
      "created_at": "2026-04-22T08:00:00.000Z"
    },
    {
      "notification_id": "n003",
      "user_id": "u001",
      "type": "level",
      "message": "Level Up! You are now Level 2 - Intermediate.",
      "is_read": true,
      "created_at": "2026-04-21T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/notifications/:userId/unread-count`

Returns only the count of unread notifications. Used by the frontend bell icon badge.

**Request**
```
GET /api/notifications/u001/unread-count
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "unread_count": 2
}
```

---

#### `PUT /api/notifications/:userId/:notificationId/read`

Marks a single notification as read.

**Path Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `userId` | string | Yes | User ID |
| `notificationId` | string | Yes | Notification ID (e.g. `n001`) |

**Request**
```
PUT /api/notifications/u001/n001/read
```

**Response `200`**
```json
{
  "success": true,
  "notification": {
    "notification_id": "n001",
    "user_id": "u001",
    "type": "points",
    "message": "You earned 50 points for completing a project!",
    "is_read": true,
    "created_at": "2026-04-22T09:30:00.000Z"
  }
}
```

**Response `404`**
```json
{
  "success": false,
  "error": "Notification \"n999\" not found for user \"u001\"."
}
```

---

#### `PUT /api/notifications/:userId/read-all`

Marks all unread notifications for a user as read in a single call.

**Request**
```
PUT /api/notifications/u001/read-all
```

**Response `200`**
```json
{
  "success": true,
  "user_id": "u001",
  "marked_read": 2
}
```

---

#### `POST /api/notifications/send`

Manually dispatch a notification. Used for internal triggers or admin testing.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | Target user ID |
| `type` | string | Yes | One of: `points`, `level`, `badge`, `challenge` |
| `message` | string | No | Custom message. Auto-generated from template if omitted |

**Request**
```json
{
  "user_id": "u001",
  "type": "badge",
  "message": "You earned the Challenge Master badge!"
}
```

**Response `202` — Accepted (queued)**
```json
{
  "success": true,
  "message": "Notification queued for delivery."
}
```

**Response `400` — Missing required field**
```json
{
  "success": false,
  "error": "Fields 'user_id' and 'type' are required."
}
```

**Response `400` — Invalid type**
```json
{
  "success": false,
  "error": "Invalid type. Must be one of: points, level, badge, challenge"
}
```

---

## Complete Endpoint Summary Table

| Method | Endpoint | WBS | SRS Req | Description |
|---|---|---|---|---|
| GET | `/health` | — | — | Server health check |
| GET | `/api/leaderboard` | 3.1.2 | REQ-22,24,25,26 | All-time or weekly leaderboard |
| GET | `/api/leaderboard/week/:weekStart` | 3.1.2 | REQ-24 | Historical week leaderboard |
| GET | `/api/leaderboard/user/:userId` | 3.1.2 | REQ-22 | Single user's rank |
| POST | `/api/leaderboard/refresh` | 3.1.3 | NFR-3 | Force cache refresh |
| GET | `/api/user/:userId/trust-score` | 3.2.4 | REQ-34,35 | Current trust score |
| POST | `/api/user/:userId/trust-score/recalculate` | 3.2.2 | REQ-33 | Recalculate on event |
| GET | `/api/user/:userId/trust-score/history` | 3.2.3 | — | Score change history |
| GET | `/api/notifications/:userId` | 3.3.3 | REQ-38,40 | Get notifications |
| GET | `/api/notifications/:userId/unread-count` | 3.3.3 | REQ-40 | Unread count |
| PUT | `/api/notifications/:userId/:notifId/read` | 3.3.3 | REQ-39 | Mark one as read |
| PUT | `/api/notifications/:userId/read-all` | 3.3.3 | REQ-39 | Mark all as read |
| POST | `/api/notifications/send` | 3.3.2 | REQ-36,37 | Send notification |

---

## NFR Compliance

| NFR | Requirement | Implementation |
|---|---|---|
| NFR-1 | API response < 2 seconds | In-memory cache for leaderboard; async queue for notifications |
| NFR-3 | Leaderboard generation < 3 seconds for 10,000 users | Pre-computed cache refreshed every 5 min via cron |
| NFR-4 | Notification delivery < 1 second after trigger | Non-blocking async queue dispatcher |
| NFR-10 | Authenticated access only | `x-user-id` header required (JWT from Module 1 when integrated) |
| NFR-11 | Admin privilege check | `x-user-role: admin` header for admin endpoints |
