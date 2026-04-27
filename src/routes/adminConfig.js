// ============================================================
// routes/adminConfig.js
// Module 11 — Admin Configuration Routes
// ✅ WBS 2.5.1 — Point Value Configuration API
// ✅ WBS 2.5.2 — Level Threshold Configuration API
// ✅ WBS 2.5.3 — Badge Rules Configuration API
// ✅ WBS 2.5.4 — Challenge Configuration API
// ============================================================

const express = require("express");
const router  = express.Router();
const db      = require("../db/pool");
const { requireUserId, requireAdmin } = require("../middleware/auth");
const { updateBadgeConfig } = require("../services/badgeService");

// All admin config routes require admin role
router.use(requireUserId, requireAdmin);

// ============================================================
// ✅ WBS 2.5.1 — Point Value Configuration
// GET  /api/gamification/admin/point-values
// PUT  /api/gamification/admin/point-values
// Manages the gamification_challenges reward_points values
// (action-type → points mapping for the points engine)
// ============================================================
router.get("/point-values", async (_req, res) => {
    try {
        const result = await db.query(
            `SELECT challenge_code, title, reward_points, action_required
             FROM gamification_challenges
             ORDER BY challenge_code`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/point-values", async (req, res) => {
    // Body: { challenge_code: "ONBOARD_01", reward_points: 75 }
    const { challenge_code, reward_points } = req.body;
    if (!challenge_code || reward_points === undefined) {
        return res.status(400).json({ success: false, message: "challenge_code and reward_points required" });
    }
    try {
        const result = await db.query(
            `UPDATE gamification_challenges SET reward_points = $1
             WHERE challenge_code = $2
             RETURNING challenge_code, title, reward_points`,
            [reward_points, challenge_code]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Challenge not found" });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
// ✅ WBS 2.5.2 — Level Threshold Configuration
// GET  /api/gamification/admin/level-thresholds
// PUT  /api/gamification/admin/level-thresholds
// Uses gamification_level_definitions table
// ============================================================
router.get("/level-thresholds", async (_req, res) => {
    try {
        const result = await db.query(
            `SELECT level_number, min_points, max_points, title
             FROM gamification_level_definitions
             ORDER BY level_number`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/level-thresholds", async (req, res) => {
    // Body: { level_number: 2, min_points: 500, title: "Intermediate" }
    const { level_number, min_points, title } = req.body;
    if (!level_number || min_points === undefined) {
        return res.status(400).json({ success: false, message: "level_number and min_points required" });
    }
    try {
        const result = await db.query(
            `INSERT INTO gamification_level_definitions (level_number, min_points, title)
             VALUES ($1, $2, $3)
             ON CONFLICT (level_number)
             DO UPDATE SET min_points = $2, title = COALESCE($3, gamification_level_definitions.title)
             RETURNING *`,
            [level_number, min_points, title || null]
        );
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
// ✅ WBS 2.5.3 — Badge Rules Configuration
// GET  /api/gamification/admin/badges
// POST /api/gamification/admin/badges
// PATCH /api/gamification/admin/badges/:badgeCode
// ============================================================
router.get("/badges", async (_req, res) => {
    try {
        const result = await db.query(
            `SELECT badge_code, name, description, category, points_awarded, is_active
             FROM gamification_badges ORDER BY badge_code`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/badges/:badgeCode", async (req, res) => {
    try {
        const badgeCode = req.params.badgeCode.toUpperCase();
        const updated   = await updateBadgeConfig(badgeCode, req.body);
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// ============================================================
// ✅ WBS 2.5.4 — Challenge Configuration
// GET    /api/gamification/admin/challenges
// POST   /api/gamification/admin/challenges
// PUT    /api/gamification/admin/challenges/:id
// DELETE /api/gamification/admin/challenges/:id
// ============================================================
router.get("/challenges", async (_req, res) => {
    try {
        const result = await db.query(
            `SELECT id, challenge_code, title, description,
                    target_count, reward_points, expiry_days,
                    challenge_type, action_required, is_active
             FROM gamification_challenges ORDER BY id`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/challenges", async (req, res) => {
    const { challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required } = req.body;
    if (!challenge_code || !title || !target_count || !reward_points || !expiry_days) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const result = await db.query(
            `INSERT INTO gamification_challenges
                 (challenge_code, title, description, target_count, reward_points,
                  expiry_days, challenge_type, action_required)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put("/challenges/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, target_count, reward_points, expiry_days, is_active } = req.body;
    try {
        const result = await db.query(
            `UPDATE gamification_challenges
             SET title        = COALESCE($1, title),
                 description  = COALESCE($2, description),
                 target_count = COALESCE($3, target_count),
                 reward_points= COALESCE($4, reward_points),
                 expiry_days  = COALESCE($5, expiry_days),
                 is_active    = COALESCE($6, is_active)
             WHERE id = $7
             RETURNING *`,
            [title, description, target_count, reward_points, expiry_days, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Challenge not found" });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.delete("/challenges/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await db.query(
            `UPDATE gamification_challenges SET is_active = FALSE WHERE id = $1`,
            [id]
        );
        res.status(200).json({ success: true, message: "Challenge deactivated" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;