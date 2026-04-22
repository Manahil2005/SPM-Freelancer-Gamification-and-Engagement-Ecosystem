// =============================================================
// src/services/trustScoreService.js
// WBS 3.2 — Trust Score Engine
// =============================================================
// Sub-tasks covered:
//   3.2.1 Define Trust Score Formula
//   3.2.2 Implement Trust Score Calculation & DB Update on triggers
//   3.2.3 Implement Trust Score History
//   3.2.4 Implement API endpoint for trust scores
//
// Formula (per WBS Dictionary 3.2.1 and PMP Quality Baseline):
//   TrustScore = (AvgRating × 20 × 0.6) + (CompletionRate × 100 × 0.4)
//   Range: 0–100 (enforced by clamp)
//
// Breakdown:
//   - AvgRating is 0–5 → multiply by 20 → becomes 0–100
//   - CompletionRate is 0–1 → multiply by 100 → becomes 0–100
//   - Weighted: 60% rating + 40% completion rate
//   - Final value clamped to [0, 100]
//
// Triggers (REQ-33): recalculate when called by:
//   - Module 1 (new rating posted)
//   - Module 3 (project marked complete)
//
// [DB SWAP] markers show exact swap points for real PostgreSQL.
// =============================================================

require("dotenv").config();
const dummy = require("../db/dummyData");
const pool  = require("../db/pool");

const USE_DUMMY = process.env.USE_DUMMY_DB === "true";

// -------------------------------------------------------
// 3.2.1 — Trust Score Formula
// -------------------------------------------------------

/**
 * Calculates trust score using the official formula.
 *
 * Formula:  (AvgRating × 20 × 0.6) + (CompletionRate × 100 × 0.4)
 * Range:    0–100  enforced by:
 *             • this clamp (application layer)
 *             • CHECK constraint in schema.sql (DB layer)
 *
 * @param {number} avgRating      - 0 to 5  (from Module 1)
 * @param {number} completionRate - 0.0 to 1.0 (from Module 3)
 * @returns {number} trust score rounded to 2 decimal places, clamped 0–100
 */
function calculateTrustScore(avgRating, completionRate) {
  // Guard against NaN / undefined inputs before touching the DB
  const rating     = isFinite(avgRating)      ? Number(avgRating)      : 0;
  const completion = isFinite(completionRate) ? Number(completionRate) : 0;

  const ratingComponent     = rating     * 20  * 0.6; // max = 60
  const completionComponent = completion * 100 * 0.4; // max = 40

  const raw = ratingComponent + completionComponent;

  // Application-layer clamp — mirrors the DB CHECK (trust_score >= 0 AND <= 100)
  const clamped = Math.min(100, Math.max(0, raw));

  return Math.round(clamped * 100) / 100; // 2 decimal precision
}

// -------------------------------------------------------
// Data layer
// -------------------------------------------------------

/**
 * Fetch a user's current rating and completion rate.
 * [DB SWAP] Replace dummy block with real pg query.
 */
async function fetchUserData(userId) {
  if (USE_DUMMY) {
    const user = dummy.users.find((u) => u.user_id === userId);
    return user || null;
  }

  // [DB SWAP] Real PostgreSQL query:
  // const { rows } = await pool.query(
  //   `SELECT user_id, name, avg_rating, completion_rate, trust_score
  //    FROM user_progress WHERE user_id = $1`,
  //   [userId]
  // );
  // return rows[0] || null;
}

/**
 * Persist updated trust score back to user_progress.
 * [DB SWAP] Replace dummy block with real pg UPDATE.
 */
async function persistTrustScore(userId, trustScore) {
  if (USE_DUMMY) {
    const user = dummy.users.find((u) => u.user_id === userId);
    if (user) user.trust_score = trustScore;
    return;
  }

  // [DB SWAP]:
  // await pool.query(
  //   `UPDATE user_progress
  //    SET trust_score = $1, updated_at = NOW()
  //    WHERE user_id = $2`,
  //   [trustScore, userId]
  // );
}

/**
 * Append a trust score history entry.
 * [DB SWAP] Replace dummy block with real pg INSERT.
 */
async function persistTrustScoreHistory(userId, trustScore, avgRating, completionRate) {
  if (USE_DUMMY) {
    if (!dummy.trustScoreHistory[userId]) {
      dummy.trustScoreHistory[userId] = [];
    }
    dummy.trustScoreHistory[userId].push({
      trust_score:     trustScore,
      avg_rating:      avgRating,
      completion_rate: completionRate,
      calculated_at:   new Date(),
    });
    return;
  }

  // [DB SWAP]:
  // await pool.query(
  //   `INSERT INTO trust_score_history (user_id, trust_score, avg_rating, completion_rate)
  //    VALUES ($1, $2, $3, $4)`,
  //   [userId, trustScore, avgRating, completionRate]
  // );
}

// -------------------------------------------------------
// 3.2.2 — Calculate & Update (the main trigger function)
// -------------------------------------------------------

/**
 * Recalculate a user's trust score and save it.
 * Call this whenever Module 1 sends a new rating OR
 * Module 3 sends a project completion event.
 *
 * Accepts optional override values so that incoming API
 * events can update the rating/completion rate at the same
 * time as triggering recalculation.
 *
 * @param {string} userId
 * @param {Object} overrides - optional { avg_rating, completion_rate }
 * @returns {Object} result with old and new trust score
 */
async function recalculateAndSave(userId, overrides = {}) {
  const user = await fetchUserData(userId);

  if (!user) {
    throw new Error(`User "${userId}" not found.`);
  }

  const oldScore = user.trust_score;

  // Apply any incoming overrides from Module 1 / Module 3 events
  const avgRating      = overrides.avg_rating      ?? user.avg_rating;
  const completionRate = overrides.completion_rate ?? user.completion_rate;

  // Update in-memory / DB values if overrides provided
  if (USE_DUMMY) {
    if (overrides.avg_rating      !== undefined) user.avg_rating      = avgRating;
    if (overrides.completion_rate !== undefined) user.completion_rate = completionRate;
  }
  // [DB SWAP] If overrides are present, run UPDATE on user_progress for
  // avg_rating and completion_rate before recalculating.

  const newScore = calculateTrustScore(avgRating, completionRate);

  // Persist updated trust score
  await persistTrustScore(userId, newScore);

  // Save history entry (WBS 3.2.3)
  await persistTrustScoreHistory(userId, newScore, avgRating, completionRate);

  console.log(
    `[TrustScore] User ${userId}: ${oldScore ?? "N/A"} → ${newScore} ` +
    `(rating=${avgRating}, completion=${completionRate})`
  );

  return {
    user_id:         userId,
    old_trust_score: oldScore,
    new_trust_score: newScore,
    avg_rating:      avgRating,
    completion_rate: completionRate,
    formula:         `(${avgRating} × 20 × 0.6) + (${completionRate} × 100 × 0.4) = ${newScore}`,
  };
}

// -------------------------------------------------------
// 3.2.3 — Trust Score History
// -------------------------------------------------------

/**
 * Fetch the historical trust score record for a user.
 * [DB SWAP] Replace dummy block with real pg query.
 */
async function getTrustScoreHistory(userId) {
  const user = await fetchUserData(userId);
  if (!user) throw new Error(`User "${userId}" not found.`);

  if (USE_DUMMY) {
    const history = dummy.trustScoreHistory[userId] || [];
    return {
      user_id: userId,
      count: history.length,
      history: [...history].reverse(), // most recent first
    };
  }

  // [DB SWAP]:
  // const { rows } = await pool.query(
  //   `SELECT trust_score, avg_rating, completion_rate, calculated_at
  //    FROM trust_score_history
  //    WHERE user_id = $1
  //    ORDER BY calculated_at DESC
  //    LIMIT 50`,
  //   [userId]
  // );
  // return { user_id: userId, count: rows.length, history: rows };
}

// -------------------------------------------------------
// 3.2.4 — Get current trust score for a user
// -------------------------------------------------------

/**
 * Return the current trust score for a user.
 * This is the endpoint Module 1 will call to display on profile.
 * (GET /api/user/:userId/trust-score)
 */
async function getTrustScore(userId) {
  const user = await fetchUserData(userId);

  if (!user) throw new Error(`User "${userId}" not found.`);

  // If no score yet, compute it now
  if (user.trust_score === null) {
    const result = await recalculateAndSave(userId);
    return {
      user_id:     userId,
      name:        user.name,
      trust_score: result.new_trust_score,
      avg_rating:  user.avg_rating,
      completion_rate: user.completion_rate,
    };
  }

  return {
    user_id:         userId,
    name:            user.name,
    trust_score:     user.trust_score,
    avg_rating:      user.avg_rating,
    completion_rate: user.completion_rate,
  };
}

module.exports = {
  calculateTrustScore,   // exported for unit testing
  recalculateAndSave,
  getTrustScore,
  getTrustScoreHistory,
};