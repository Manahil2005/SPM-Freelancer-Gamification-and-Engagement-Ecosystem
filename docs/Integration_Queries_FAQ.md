# Module 11 — Integration Queries & Clarifications
## WBS 5.3.3 — Address Integration Group Queries & Clarifications

This document answers every common question that comes up during integration.
Updated as new queries arrive. Last updated: April 2026.

---

## General

**Q: What is the base URL for Module 11?**
Development: `http://localhost:5000`
For the demo, the URL will be provided by the hosting setup (Render free-tier or local machine). Contact Manahil for the final URL before Week 7.

---

**Q: Do I need an API key to call Module 11?**
No API key required. Pass the user's ID in the `x-user-id` header:
```
x-user-id: u001
```
When Module 1's JWT auth is integrated in the final sprint, this will be replaced with a Bearer token. Module 11 will update the auth middleware at that point. For now, the header stub is sufficient.

---

**Q: What Content-Type should I use?**
Always `application/json` for POST and PUT requests. GET requests need no Content-Type header.

---

**Q: What format does Module 11 return errors in?**
All errors follow this exact shape:
```json
{ "success": false, "error": "Human-readable description" }
```
HTTP status codes: 400 (bad input), 404 (not found), 500 (server error). Forward them as-is.

---

## Leaderboard

**Q: What is the difference between `total_points` and `points_for_rank` in the leaderboard response?**

- `total_points` = all-time accumulated points for the user. Always present in every response for display purposes.
- `points_for_rank` = the value used to determine the user's rank on this board.
  - For `period=all`: `points_for_rank` equals `total_points`
  - For `period=weekly`: `points_for_rank` equals points earned in the **current ISO week only**

A user with 3200 total points but only 75 points this week will rank below a user with 1100 total points who earned 410 this week — on the weekly board.

---

**Q: The weekly leaderboard has fewer users than the all-time board. Is that a bug?**
No. Users with zero activity in the current week are excluded from the weekly leaderboard. Only users who have earned at least one point this week appear. This is by design.

---

**Q: What is "this week"? Does it reset at midnight on Sunday?**
The week is an ISO week: Monday 00:00 UTC to Sunday 23:59 UTC. The week resets at Monday 00:00 UTC. The `week_start` field in responses always shows the Monday date of the current week.

---

**Q: How often is the leaderboard updated?**
The in-memory cache refreshes automatically every 5 minutes via a cron job. You can also force a refresh by calling `POST /api/leaderboard/refresh`. For real-time use cases, call the refresh endpoint after a bulk points award.

---

**Q: Can I get the leaderboard for a past week?**
Yes. Use:
```
GET /api/leaderboard/week/2026-04-13
```
The date must be the Monday of the target week in `YYYY-MM-DD` format. The system stores weekly_points_log entries permanently.

---

**Q: How are ties broken in the leaderboard?**
Three-level sort:
1. `points_for_rank` descending
2. `activity_count` descending (more active user wins)
3. `created_at` ascending (older member wins)

Standard competition ranking is used: if two users tie at rank 2, the next user is rank 4 (not rank 3).

---

## Trust Score

**Q: What is the trust score formula?**
```
TrustScore = (AvgRating × 20 × 0.6) + (CompletionRate × 100 × 0.4)
```
Range: 0 to 100. Both the application and the database enforce this range.

---

**Q: Who calls the recalculate endpoint and when?**
- **Module 1** calls it when a client submits a new rating. Pass `{ "avg_rating": <new_average> }`
- **Module 3** calls it when a freelancer completes a project. Pass `{ "completion_rate": <ratio> }`
You can pass both fields together if both change simultaneously.

---

**Q: If I only send avg_rating, does the completion_rate reset to zero?**
No. Each field is optional. If you omit `completion_rate`, Module 11 keeps the last stored value. Only the fields you send are updated before recalculation.

---

**Q: What units is avg_rating in?**
0.0 to 5.0 (a 5-star scale). If you use a 10-point scale internally, divide by 2 before sending.

---

**Q: What units is completion_rate in?**
A decimal fraction: 0.0 = 0%, 1.0 = 100%. Do **not** send a percentage (e.g. 95 instead of 0.95) — that will be rejected with a 400 error.

---

**Q: The trust score is `null` for a new user. Is that expected?**
Yes. The score is `null` until the first recalculate call or until `GET /trust-score` is called (which auto-computes on first access). After the first computation it is always a number between 0 and 100.

---

**Q: Does the trust score change automatically or do we have to call recalculate?**
You must call recalculate. Module 11 does not poll external modules. Modules 1 and 3 are responsible for calling the recalculate endpoint when their data changes.

---

## Notifications

**Q: The notification type `points` is being used for trust score changes too. Why?**
Trust score changes are surfaced through the `points` notification type as they are part of the broader points/reputation economy. If you need to distinguish them on the frontend, check the message text. A dedicated `trust_score` type may be added in a future sprint if requested.

---

**Q: Can I send a notification from another module?**
Yes, use:
```
POST /api/notifications/send
Body: { "user_id": "...", "type": "points|level|badge|challenge", "message": "..." }
```
Valid types are: `points`, `level`, `badge`, `challenge`. Any other type will be rejected with a 400 error.

---

**Q: Are notifications delivered in real-time (WebSocket)?**
No — Module 11 uses a polling model. The frontend calls `GET /api/notifications/{userId}/unread-count` on page load and periodically to check for new notifications. The delivery latency is < 1 second from trigger to DB write (NFR-4). True real-time push (WebSocket) is out of scope per the project scope statement.

---

**Q: Where are notifications stored?**
In the `notifications` table in PostgreSQL (or `dummyData.notifications` array in dummy mode). They persist until explicitly read or until the DB is reset.

---

## Database & Schema

**Q: Where is the weekly points data stored? I don't see it in UserProgress.**
Weekly points are stored in a separate table: `weekly_points_log`. Each row represents one user's points earned in one ISO week (one row per user per week, enforced by a UNIQUE constraint). The `user_progress` table stores only all-time cumulative `total_points`. This separation makes both boards efficient.

---

**Q: How do I switch from dummy DB to real PostgreSQL?**
1. Run `psql -d gamification_db -f src/db/schema.sql` to create tables and seed data
2. Set `USE_DUMMY_DB=false` in `.env` and fill in your DB credentials
3. In each service file, find `// [DB SWAP]` comments and uncomment the pg query block directly below, deleting the dummy block above it
4. Restart the server

---

**Q: The trust_score column has a CHECK constraint in the schema. What happens if a bad value is computed?**
The application layer clamps the value to 0–100 before writing. The DB CHECK is a safety net. In practice you will never see a constraint violation from normal operation. If you do see one, it means a NaN value was sent — check your input data.

---

## For Module 13 Specifically

**Q: Do the Module 11 endpoints require any special routing prefix?**
No. Module 11 endpoints follow the pattern `/api/...`. If Module 13 adds a module prefix, agree on it with the Module 11 lead before Week 7 so the Postman collection can be updated.

**Q: Does Module 11 support CORS?**
Yes. CORS is enabled for all origins in development (`cors()` middleware). For production, restrict this to the platform's domain if needed.

**Q: Can Module 13 cache Module 11 responses?**
The leaderboard endpoint already caches internally. For the trust score and notifications, do not cache on the integration layer — these need to reflect real-time state.

**Q: What happens if Module 11 is down when Module 13 routes a request?**
Module 11 will return a 500. Module 13 should handle this gracefully and return an appropriate error to the calling module. Module 11 does not implement circuit breakers (out of scope), so Module 13 should handle retry logic if needed.
