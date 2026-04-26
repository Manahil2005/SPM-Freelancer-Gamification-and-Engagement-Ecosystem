// =============================================================
// src/services/trustScoreService.js
// WBS 3.2 — Trust Score Engine
// =============================================================
// CHANGES FROM DUMMY VERSION:
//   - All [DB SWAP] comments are now active real queries
//   - Table names updated to centralized DB prefix:
//       user_progress        → gamification_user_progress
//       trust_score_history  → gamification_trust_score_history
//   - user_id is now INTEGER — matches users.id
//   - column `level` renamed to `current_level`
//   - name fetched by joining users table
//   - dummy data blocks removed entirely
//   - recalculateAndSave() updates avg_rating/completion_rate
//     via a real UPDATE query when overrides are provided
// =============================================================

require("dotenv").config();
const pool = require("../db/pool");

// -------------------------------------------------------
// 3.2.1 — Trust Score Formula (unchanged)
// -------------------------------------------------------
function calculateTrustScore(avgRating, completionRate) {
  const rating     = isFinite(avgRating)      ? Number(avgRating)      : 0;
  const completion = isFinite(completionRate) ? Number(completionRate) : 0;

  const raw     = (rating * 20 * 0.6) + (completion * 100 * 0.4);
  const clamped = Math.min(100, Math.max(0, raw));
  return Math.round(clamped * 100) / 100;
}

// -------------------------------------------------------
// Data layer — real PostgreSQL queries
// -------------------------------------------------------

// CHANGED: queries gamification_user_progress
//          joins users table for name
async function fetchUserData(userId) {
  const { rows } = await pool.query(
    `SELECT
       gup.user_id,
       gup.avg_rating,
       gup.completion_rate,
       gup.trust_score,
       gup.current_level AS level,
       u.first_name,
       u.last_name
     FROM gamification_user_progress gup
     JOIN users u ON u.id = gup.user_id
     WHERE gup.user_id = $1`,
    [userId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    name: `${rows[0].first_name} ${rows[0].last_name}`,
  };
}

// CHANGED: updates gamification_user_progress (centralized table name)
async function persistTrustScore(userId, trustScore) {
  await pool.query(
    `UPDATE gamification_user_progress
     SET trust_score = $1, updated_at = NOW()
     WHERE user_id = $2`,
    [trustScore, userId]
  );
}

// CHANGED: inserts into gamification_trust_score_history (centralized table name)
async function persistTrustScoreHistory(userId, trustScore, avgRating, completionRate) {
  await pool.query(
    `INSERT INTO gamification_trust_score_history
       (user_id, trust_score, avg_rating, completion_rate)
     VALUES ($1, $2, $3, $4)`,
    [userId, trustScore, avgRating, completionRate]
  );
}

// -------------------------------------------------------
// 3.2.2 — Calculate & Update
// -------------------------------------------------------

// CHANGED: when overrides are present, runs a real UPDATE on
//          avg_rating / completion_rate in gamification_user_progress
async function recalculateAndSave(userId, overrides = {}) {
  const user = await fetchUserData(userId);
  if (!user) throw new Error(`User "${userId}" not found.`);

  const oldScore       = user.trust_score;
  const avgRating      = overrides.avg_rating      ?? user.avg_rating;
  const completionRate = overrides.completion_rate ?? user.completion_rate;

  // CHANGED: persist incoming overrides to the DB immediately
  if (overrides.avg_rating !== undefined || overrides.completion_rate !== undefined) {
    await pool.query(
      `UPDATE gamification_user_progress
       SET avg_rating      = $1,
           completion_rate = $2,
           updated_at      = NOW()
       WHERE user_id = $3`,
      [avgRating, completionRate, userId]
    );
  }

  const newScore = calculateTrustScore(avgRating, completionRate);

  await persistTrustScore(userId, newScore);
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

// CHANGED: queries gamification_trust_score_history
async function getTrustScoreHistory(userId) {
  const user = await fetchUserData(userId);
  if (!user) throw new Error(`User "${userId}" not found.`);

  const { rows } = await pool.query(
    `SELECT trust_score, avg_rating, completion_rate, calculated_at
     FROM gamification_trust_score_history
     WHERE user_id = $1
     ORDER BY calculated_at DESC
     LIMIT 50`,
    [userId]
  );

  return { user_id: userId, count: rows.length, history: rows };
}

// -------------------------------------------------------
// 3.2.4 — Get current trust score
// -------------------------------------------------------
async function getTrustScore(userId) {
  const user = await fetchUserData(userId);
  if (!user) throw new Error(`User "${userId}" not found.`);

  if (user.trust_score === null) {
    const result = await recalculateAndSave(userId);
    return {
      user_id:         userId,
      name:            user.name,
      trust_score:     result.new_trust_score,
      avg_rating:      user.avg_rating,
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
  calculateTrustScore,
  recalculateAndSave,
  getTrustScore,
  getTrustScoreHistory,
};