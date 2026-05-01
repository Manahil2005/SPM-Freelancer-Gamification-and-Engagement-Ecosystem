// ============================================================
// routes/challenges.js
// Module 11 — Time-Based Challenge Routes (NEW)
// ✅ WBS 2.4   — Daily / Weekly / Monthly Challenge APIs
// ✅ WBS 2.4.1 — Challenge Assignment
// ✅ WBS 2.4.2 — Challenge Progress Tracking
// ✅ WBS 2.4.3 — Challenge Completion & Reward
// ✅ WBS 2.4.4 — Challenge Expiry
//
// All routes mounted under /api/gamification (see index.js)
// Full path examples:
//   GET  /api/gamification/user/:userId/challenges
//   GET  /api/gamification/user/:userId/challenges/daily
//   POST /api/gamification/user/:userId/challenges/:challengeCode/progress
//   POST /api/gamification/user/:userId/challenges/assign-period/:type
//   GET  /api/gamification/challenges/active
// ============================================================

const express          = require("express");
const router           = express.Router();
const { requireUserId, requireAdmin } = require("../middleware/auth");
const challengeService = require("../services/challengeService");

// ============================================================
// GET /api/gamification/user/:userId/challenges
// Optional ?type=daily|weekly|monthly
// ✅ WBS 2.4.2 — Returns all active timed challenges + progress
// ============================================================
router.get("/user/:userId/challenges", requireUserId, async (req, res) => {
    try {
        const userId        = parseInt(req.params.userId);
        const challengeType = req.query.type || null; // daily | weekly | monthly | null = all

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const allowedTypes = ["daily", "weekly", "monthly", null];
        if (!allowedTypes.includes(challengeType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type. Must be daily, weekly, or monthly"
            });
        }

        const result = await challengeService.getUserTimedChallenges(userId, challengeType);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ============================================================
// GET /api/gamification/user/:userId/challenges/daily
// GET /api/gamification/user/:userId/challenges/weekly
// GET /api/gamification/user/:userId/challenges/monthly
// Convenience shorthand routes for each type
// ✅ WBS 2.4.2
// ============================================================
["daily", "weekly", "monthly"].forEach((type) => {
    router.get(`/user/:userId/challenges/${type}`, requireUserId, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid userId" });
            }
            const result = await challengeService.getUserTimedChallenges(userId, type);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });
});

// ============================================================
// GET /api/gamification/user/:userId/challenges/stats
// Returns completion counts grouped by type
// ✅ WBS 2.4.1
// ============================================================
router.get("/user/:userId/challenges/stats", requireUserId, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const stats = await challengeService.getChallengeStats(userId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ============================================================
// POST /api/gamification/user/:userId/challenges/assign-period/:type
// Bulk-assigns all challenges of a given type for the current period.
// Called on first login of a new day/week/month.
// ✅ WBS 2.4.1
// Body: none required
// ============================================================
router.post("/user/:userId/challenges/assign-period/:type", requireUserId, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const type   = req.params.type;

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        if (!["daily", "weekly", "monthly"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "type must be daily, weekly, or monthly"
            });
        }

        const results = await challengeService.assignAllChallengesForPeriod(userId, type);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ============================================================
// POST /api/gamification/user/:userId/challenges/:challengeCode/progress
// Records progress on a specific timed challenge.
// ✅ WBS 2.4.2 — Progress Tracking
// ✅ WBS 2.4.3 — Auto-completes and awards points when target hit
// Body: { increment?: number }  (default 1)
// ============================================================
router.post(
    "/user/:userId/challenges/:challengeCode/progress",
    requireUserId,
    async (req, res) => {
        try {
            const userId        = parseInt(req.params.userId);
            const challengeCode = String(req.params.challengeCode || "").trim().toUpperCase();
            const increment     = parseInt(req.body.increment || 1);

            if (isNaN(userId) || !challengeCode) {
                return res.status(400).json({ success: false, message: "Invalid userId or challengeCode" });
            }
            if (isNaN(increment) || increment < 1) {
                return res.status(400).json({ success: false, message: "increment must be a positive integer" });
            }

            const result = await challengeService.recordChallengeProgress(
                userId,
                challengeCode,
                increment
            );

            // If challenge just completed, also evaluate badges
            if (result.completed) {
                require("../services/gamificationService")
                    .evaluateBadges(userId)
                    .catch(err => console.error("[Badge Engine] Post-challenge eval failed:", err.message));
            }

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// ============================================================
// GET /api/gamification/challenges/active
// Returns all active challenge definitions (admin/debug view)
// ✅ WBS 2.4 — supports filtering by ?type=daily|weekly|monthly
// ============================================================
router.get("/challenges/active", requireUserId, async (req, res) => {
    try {
        const db   = require("../db/pool");
        const type = req.query.type;

        const typeClause = type ? `AND challenge_type = $1` : "";
        const params     = type ? [type] : [];

        const result = await db.query(
            `SELECT id, challenge_code, title, description,
                    challenge_type, target_count, reward_points,
                    expiry_days, action_required, is_active
             FROM gamification_challenges
             WHERE is_active = TRUE
               ${typeClause}
             ORDER BY challenge_type, challenge_code`,
            params
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
// POST /api/gamification/admin/challenges/expire
// Manually trigger expiry sweep (admin only)
// ✅ WBS 2.4.4
// ============================================================
router.post(
    "/admin/challenges/expire",
    requireUserId,
    requireAdmin,
    async (req, res) => {
        try {
            const count = await challengeService.expireStaleUserChallenges();
            res.status(200).json({ success: true, expiredCount: count });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;