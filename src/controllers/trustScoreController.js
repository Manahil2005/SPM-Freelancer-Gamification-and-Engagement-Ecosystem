// =============================================================
// src/controllers/trustScoreController.js
// WBS 3.2.4 — Trust Score API endpoint handlers
// =============================================================

const trustScoreService  = require("../services/trustScoreService");
const notificationService = require("../services/notificationService");

/**
 * GET /api/user/:userId/trust-score
 * Returns the current trust score for a user.
 * This is the endpoint Module 1 calls to display on the freelancer profile.
 * REQ-34, REQ-35
 */
async function getTrustScore(req, res) {
  try {
    const { userId } = req.params;

    const result = await trustScoreService.getTrustScore(userId);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[TrustScore] getTrustScore error:", err.message);

    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * POST /api/user/:userId/trust-score/recalculate
 * Trigger a trust score recalculation.
 * Called by Module 1 (new rating) or Module 3 (project completed).
 *
 * Body (all optional):
 *   { avg_rating: number, completion_rate: number }
 * REQ-33
 */
async function recalculateTrustScore(req, res) {
  try {
    const { userId } = req.params;
    const overrides  = {};

    // Accept optional updates from incoming events
    if (req.body.avg_rating      !== undefined) overrides.avg_rating      = parseFloat(req.body.avg_rating);
    if (req.body.completion_rate !== undefined) overrides.completion_rate = parseFloat(req.body.completion_rate);

    // Validate range if provided
    if (overrides.avg_rating !== undefined && (overrides.avg_rating < 0 || overrides.avg_rating > 5)) {
      return res.status(400).json({ success: false, error: "avg_rating must be between 0 and 5." });
    }
    if (overrides.completion_rate !== undefined && (overrides.completion_rate < 0 || overrides.completion_rate > 1)) {
      return res.status(400).json({ success: false, error: "completion_rate must be between 0.0 and 1.0." });
    }

    const result = await trustScoreService.recalculateAndSave(userId, overrides);

    // Fire a notification if score changed significantly (>5 points)
    if (
      result.old_trust_score !== null &&
      Math.abs(result.new_trust_score - result.old_trust_score) >= 5
    ) {
      const direction = result.new_trust_score > result.old_trust_score ? "increased" : "decreased";
      notificationService.enqueueNotification(
        userId,
        "points",
        `Your Trust Score has ${direction} to ${result.new_trust_score}!`
      );
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[TrustScore] recalculate error:", err.message);

    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * GET /api/user/:userId/trust-score/history
 * Returns historical trust score changes.
 * WBS 3.2.3
 */
async function getTrustScoreHistory(req, res) {
  try {
    const { userId } = req.params;

    const result = await trustScoreService.getTrustScoreHistory(userId);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[TrustScore] history error:", err.message);

    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

module.exports = { getTrustScore, recalculateTrustScore, getTrustScoreHistory };
