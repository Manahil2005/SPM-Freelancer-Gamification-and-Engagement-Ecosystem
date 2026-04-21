// =============================================================
// src/services/leaderboardService.js
// WBS 3.1 — Leaderboard Engine
// =============================================================
// Sub-tasks covered:
//   3.1.1 Design Leaderboard Ranking Algorithm with Tiebreaker
//   3.1.2 Implement Realtime Leaderboard Calculation API
//   3.1.3 Implement Leaderboard Caching Strategy (in-memory)
//
// Algorithm (per SRS REQ-22, REQ-23, REQ-24, REQ-25, NFR-3):
//   PRIMARY  sort: total_points DESC
//   TIEBREAK sort: activity_count DESC (activity frequency)
//   FINAL    sort: created_at ASC (longest member wins)
//
// Caching: an in-memory snapshot is refreshed every 5 minutes
//   via a node-cron job registered in index.js.
//   [DB SWAP] sections show exact spots to replace with pg queries.
// =============================================================

require("dotenv").config();
const dummy = require("../db/dummyData");
const pool  = require("../db/pool");

const USE_DUMMY = process.env.USE_DUMMY_DB === "true";

// -------------------------------------------------------
// In-memory cache (WBS 3.1.3)
// { weekly: [...ranked], all: [...ranked], lastRefreshed: Date }
// -------------------------------------------------------
const cache = {
  weekly: null,
  all:    null,
  lastRefreshed: null,
};

// How many minutes to keep cache alive before forcing refresh
const CACHE_TTL_MINUTES = 5;

// -------------------------------------------------------
// Core ranking algorithm (WBS 3.1.1)
// -------------------------------------------------------
/**
 * Ranks an array of user objects using the 3-level sort:
 *   1. total_points DESC
 *   2. activity_count DESC (tiebreaker per SRS REQ-23)
 *   3. created_at ASC     (longest member as final tiebreaker)
 *
 * @param {Array} users - raw user rows
 * @returns {Array} ranked users with a `rank` field added
 */
function applyRankingAlgorithm(users) {
  const sorted = [...users].sort((a, b) => {
    // Primary: more points = higher rank
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }

    // Tiebreaker 1: more activity = higher rank
    if (b.activity_count !== a.activity_count) {
      return b.activity_count - a.activity_count;
    }

    // Tiebreaker 2: older member wins (joined earlier = more loyal)
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Attach rank numbers (ties get same rank with gap after, e.g. 1,1,3)
  let currentRank = 1;
  return sorted.map((user, idx) => {
    if (idx > 0) {
      const prev = sorted[idx - 1];
      const sameTier =
        user.total_points === prev.total_points &&
        user.activity_count === prev.activity_count;

      if (!sameTier) currentRank = idx + 1;
    }

    return {
      rank:          currentRank,
      user_id:       user.user_id,
      name:          user.name,
      total_points:  user.total_points,
      level:         user.level,
      activity_count: user.activity_count,
    };
  });
}

// -------------------------------------------------------
// Data fetching layer (swappable dummy ↔ real DB)
// -------------------------------------------------------

/**
 * Fetch all users for leaderboard computation.
 * [DB SWAP] Replace dummy block with real pg query when DB is ready.
 */
async function fetchAllUsers() {
  if (USE_DUMMY) {
    // Dummy: return in-memory users array
    return dummy.users;
  }

  // [DB SWAP] Real PostgreSQL query:
  // const { rows } = await pool.query(`
  //   SELECT user_id, name, total_points, level, activity_count, created_at
  //   FROM user_progress
  //   ORDER BY total_points DESC
  // `);
  // return rows;
}

/**
 * Fetch users active in the current week only.
 * "Active this week" = activity_count updated within last 7 days.
 * [DB SWAP] Replace with a real query filtering on updated_at.
 */
async function fetchWeeklyActiveUsers() {
  if (USE_DUMMY) {
    // Dummy: use all users (no date filtering possible in dummy)
    // In production this will filter to only users active this week
    return dummy.users;
  }

  // [DB SWAP] Real PostgreSQL query:
  // const { rows } = await pool.query(`
  //   SELECT user_id, name, total_points, level, activity_count, created_at
  //   FROM user_progress
  //   WHERE updated_at >= NOW() - INTERVAL '7 days'
  // `);
  // return rows;
}

// -------------------------------------------------------
// Cache logic (WBS 3.1.3)
// -------------------------------------------------------

function isCacheStale() {
  if (!cache.lastRefreshed) return true;
  const ageMs = Date.now() - cache.lastRefreshed.getTime();
  return ageMs > CACHE_TTL_MINUTES * 60 * 1000;
}

/**
 * Recomputes and stores both leaderboard views in cache.
 * Called by cron job every 5 min and on first request.
 */
async function refreshCache() {
  const [allUsers, weeklyUsers] = await Promise.all([
    fetchAllUsers(),
    fetchWeeklyActiveUsers(),
  ]);

  cache.all    = applyRankingAlgorithm(allUsers);
  cache.weekly = applyRankingAlgorithm(weeklyUsers);
  cache.lastRefreshed = new Date();

  console.log(`[Leaderboard] Cache refreshed at ${cache.lastRefreshed.toISOString()}`);
}

// -------------------------------------------------------
// Public service methods (WBS 3.1.2)
// -------------------------------------------------------

/**
 * Get leaderboard for a given period.
 * @param {string} period - "weekly" | "all"
 * @param {number} limit  - max results to return (default 50)
 * @returns {Object} { period, count, data, lastRefreshed }
 */
async function getLeaderboard(period = "all", limit = 50) {
  if (!["weekly", "all"].includes(period)) {
    throw new Error(`Invalid period "${period}". Use "weekly" or "all".`);
  }

  // Refresh cache if stale
  if (isCacheStale()) {
    await refreshCache();
  }

  const data = (cache[period] || []).slice(0, limit);

  return {
    period,
    count: data.length,
    lastRefreshed: cache.lastRefreshed,
    data,
  };
}

/**
 * Get a single user's rank in a given period.
 * @param {string} userId
 * @param {string} period - "weekly" | "all"
 */
async function getUserRank(userId, period = "all") {
  if (isCacheStale()) await refreshCache();

  const board = cache[period] || [];
  const entry = board.find((u) => u.user_id === userId);

  if (!entry) {
    return { user_id: userId, period, rank: null, message: "User not found in leaderboard." };
  }

  return { user_id: userId, period, ...entry };
}

/**
 * Force a cache refresh (called by cron job in index.js).
 */
async function forceRefresh() {
  await refreshCache();
}

module.exports = { getLeaderboard, getUserRank, forceRefresh };
