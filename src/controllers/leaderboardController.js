// =============================================================
// src/controllers/leaderboardController.js
// WBS 3.1.2 — Leaderboard API endpoint handlers
// =============================================================

const leaderboardService = require("../services/leaderboardService");

/**
 * GET /api/leaderboard?period=all|weekly&limit=50
 * REQ-22, REQ-24, REQ-25, REQ-26
 */
async function getLeaderboard(req, res) {
  try {
    const period = req.query.period || "all";
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100); // cap at 100

    const result = await leaderboardService.getLeaderboard(period, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[Leaderboard] getLeaderboard error:", err.message);

    if (err.message.includes("Invalid period")) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error while fetching leaderboard.",
    });
  }
}

/**
 * GET /api/leaderboard/user/:userId?period=all|weekly
 * Returns a specific user's rank in the leaderboard.
 */
async function getUserRank(req, res) {
  try {
    const { userId } = req.params;
    const period = req.query.period || "all";

    const result = await leaderboardService.getUserRank(userId, period);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[Leaderboard] getUserRank error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * POST /api/leaderboard/refresh
 * Force-refresh the leaderboard cache (admin only in production).
 */
async function forceRefresh(req, res) {
  try {
    await leaderboardService.forceRefresh();
    return res.status(200).json({ success: true, message: "Leaderboard cache refreshed." });
  } catch (err) {
    console.error("[Leaderboard] forceRefresh error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

module.exports = { getLeaderboard, getUserRank, forceRefresh };
