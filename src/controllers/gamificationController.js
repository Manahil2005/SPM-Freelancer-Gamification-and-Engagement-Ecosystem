// =============================================================
// src/controllers/gamificationController.js
// Module 11 — Gamification Controller
// Handles HTTP requests for gamification features
// =============================================================

const gamificationService = require("../services/gamificationService");
const badgeService        = require("../services/badgeService");

// -------------------------------------------------------
// WBS 2.1.2 — Points Award API
// POST /api/gamification/points/award
// Body: { user_id, action_type, points }
// -------------------------------------------------------
async function handleAwardPoints(req, res) {
  try {
    const { user_id, action_type, points } = req.body;
    if (!user_id || !action_type || !points) {
      return res.status(400).json({
        success: false,
        error: "user_id, action_type and points are required."
      });
    }
    const result = await gamificationService.awardPoints(user_id, action_type, points);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[gamificationController] handleAwardPoints:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// -------------------------------------------------------
// WBS 2.2.3 — Achievement Tracking API
// GET /api/gamification/user/:userId/badges
// Returns all badges earned by the user
// -------------------------------------------------------
async function handleGetUserBadges(req, res) {
  try {
    const { userId } = req.params;
    const result = await badgeService.getUserBadges(userId);
    return res.status(200).json({ success: true, badges: result });
  } catch (err) {
    console.error("[gamificationController] handleGetUserBadges:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// -------------------------------------------------------
// WBS 5.1.4 — User Profile Endpoint (for Module 1)
// GET /api/gamification/user/:userId/profile
// Returns: total_points, level, trust_score, top 3 badges
// -------------------------------------------------------
async function handleGetUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const result = await gamificationService.getUserProfile(userId);
    if (!result) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[gamificationController] handleGetUserProfile:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// -------------------------------------------------------
// WBS 5.1.3 — Audit Log Retrieval (Admin Only)
// GET /api/gamification/admin/audit-logs
// Returns all admin action logs
// -------------------------------------------------------
async function handleGetAuditLogs(req, res) {
  try {
    const result = await gamificationService.getAuditLogs();
    return res.status(200).json({ success: true, logs: result });
  } catch (err) {
    console.error("[gamificationController] handleGetAuditLogs:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// -------------------------------------------------------
// Export all handlers
// -------------------------------------------------------
module.exports = {
  handleAwardPoints,
  handleGetUserBadges,
  handleGetUserProfile,
  handleGetAuditLogs,
};