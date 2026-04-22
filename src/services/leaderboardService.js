// =============================================================
// src/services/leaderboardService.js
// WBS 3.1 — Leaderboard Engine
// =============================================================
// Sub-tasks covered:
//   3.1.1 Design Leaderboard Ranking Algorithm with Tiebreaker
//   3.1.2 Implement Realtime Leaderboard Calculation API
//   3.1.3 Implement Leaderboard Caching Strategy (in-memory)
//
// ALL-TIME board:  ranks on total_points (user_progress table)
// WEEKLY board:    ranks on points_earned THIS week (weekly_points_log table)
//
// Tiebreaker in both cases: activity_count DESC → created_at ASC
//
// [DB SWAP] sections show exact spots to replace with pg queries.
// =============================================================

require("dotenv").config();
const dummy = require("../db/dummyData");
const pool  = require("../db/pool");

const USE_DUMMY = process.env.USE_DUMMY_DB === "true";

// -------------------------------------------------------
// In-memory cache (WBS 3.1.3)
// -------------------------------------------------------
const cache = {
  weekly: null,
  all:    null,
  lastRefreshed: null,
};

const CACHE_TTL_MINUTES = 5;

// -------------------------------------------------------
// Core ranking algorithm (WBS 3.1.1)
// -------------------------------------------------------
/**
 * Ranks an array of user objects.
 * @param {Array} users - each must have: points_for_rank, activity_count, created_at
 *   plus display fields: user_id, name, level, total_points
 * @returns {Array} ranked list with `rank` added
 */
function applyRankingAlgorithm(users) {
  const sorted = [...users].sort((a, b) => {
    // Primary: ranking points DESC (weekly pts or all-time pts depending on board)
    if (b.points_for_rank !== a.points_for_rank) {
      return b.points_for_rank - a.points_for_rank;
    }
    // Tiebreaker 1: more activity this period = higher rank (REQ-23)
    if (b.activity_count !== a.activity_count) {
      return b.activity_count - a.activity_count;
    }
    // Tiebreaker 2: older member wins
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Standard competition ranking: 1,1,3 (not 1,1,2)
  let currentRank = 1;
  return sorted.map((user, idx) => {
    if (idx > 0) {
      const prev = sorted[idx - 1];
      const sameTier =
        user.points_for_rank === prev.points_for_rank &&
        user.activity_count  === prev.activity_count;
      if (!sameTier) currentRank = idx + 1;
    }
    return {
      rank:            currentRank,
      user_id:         user.user_id,
      name:            user.name,
      level:           user.level,
      total_points:    user.total_points,    // always all-time (for display)
      points_for_rank: user.points_for_rank, // what the ranking is based on
      activity_count:  user.activity_count,
    };
  });
}

// -------------------------------------------------------
// Data fetching layer (dummy <-> real DB)
// -------------------------------------------------------

/**
 * ALL-TIME leaderboard data: ranks on total_points.
 * [DB SWAP] Replace dummy block with real pg query.
 */
async function fetchAllTimeData() {
  if (USE_DUMMY) {
    return dummy.users.map((u) => ({
      user_id:         u.user_id,
      name:            u.name,
      level:           u.level,
      total_points:    u.total_points,
      points_for_rank: u.total_points,   // all-time board ranks on total_points
      activity_count:  u.activity_count,
      created_at:      u.created_at,
    }));
  }

  // [DB SWAP] Real PostgreSQL query:
  // const { rows } = await pool.query(`
  //   SELECT user_id, name, level, total_points,
  //          total_points AS points_for_rank,
  //          activity_count, created_at
  //   FROM user_progress
  // `);
  // return rows;
}

/**
 * WEEKLY leaderboard data: ranks on points earned in the CURRENT week only.
 * Joins weekly_points_log for this week's points with user_progress for display info.
 * Users with NO activity this week are excluded from the weekly board.
 * [DB SWAP] Replace dummy block with real pg query.
 */
async function fetchWeeklyData() {
  if (USE_DUMMY) {
    const thisWeek = dummy.getWeekStart();

    // Get this week's log entries
    const weekEntries = dummy.weeklyPointsLog.filter(
      (e) => e.week_start === thisWeek
    );

    // Join with users for display info
    return weekEntries.map((entry) => {
      const user = dummy.users.find((u) => u.user_id === entry.user_id);
      if (!user) return null;
      return {
        user_id:         user.user_id,
        name:            user.name,
        level:           user.level,
        total_points:    user.total_points,    // all-time (for display only)
        points_for_rank: entry.points_earned,  // weekly board ranks on THIS week's points
        activity_count:  entry.activity_count, // this week's activity count for tiebreaker
        created_at:      user.created_at,
        week_start:      thisWeek,
      };
    }).filter(Boolean);
  }

  // [DB SWAP] Real PostgreSQL query:
  // const { rows } = await pool.query(`
  //   SELECT
  //     up.user_id, up.name, up.level, up.total_points, up.created_at,
  //     wpl.points_earned  AS points_for_rank,
  //     wpl.activity_count,
  //     wpl.week_start
  //   FROM weekly_points_log wpl
  //   JOIN user_progress up ON up.user_id = wpl.user_id
  //   WHERE wpl.week_start = DATE_TRUNC('week', NOW())::DATE
  // `);
  // return rows;
}

/**
 * HISTORICAL weekly leaderboard for a specific past week.
 * @param {string} weekStart - 'YYYY-MM-DD' Monday of the desired week
 * [DB SWAP] Replace dummy block with real pg query.
 */
async function fetchWeeklyDataForWeek(weekStart) {
  if (USE_DUMMY) {
    const weekEntries = dummy.weeklyPointsLog.filter(
      (e) => e.week_start === weekStart
    );
    return weekEntries.map((entry) => {
      const user = dummy.users.find((u) => u.user_id === entry.user_id);
      if (!user) return null;
      return {
        user_id:         user.user_id,
        name:            user.name,
        level:           user.level,
        total_points:    user.total_points,
        points_for_rank: entry.points_earned,
        activity_count:  entry.activity_count,
        created_at:      user.created_at,
        week_start:      weekStart,
      };
    }).filter(Boolean);
  }

  // [DB SWAP]:
  // const { rows } = await pool.query(`
  //   SELECT
  //     up.user_id, up.name, up.level, up.total_points, up.created_at,
  //     wpl.points_earned  AS points_for_rank,
  //     wpl.activity_count,
  //     wpl.week_start
  //   FROM weekly_points_log wpl
  //   JOIN user_progress up ON up.user_id = wpl.user_id
  //   WHERE wpl.week_start = $1
  // `, [weekStart]);
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

async function refreshCache() {
  const [allData, weeklyData] = await Promise.all([
    fetchAllTimeData(),
    fetchWeeklyData(),
  ]);

  cache.all    = applyRankingAlgorithm(allData);
  cache.weekly = applyRankingAlgorithm(weeklyData);
  cache.lastRefreshed = new Date();

  console.log(`[Leaderboard] Cache refreshed at ${cache.lastRefreshed.toISOString()}`);
}

// -------------------------------------------------------
// Public service methods (WBS 3.1.2)
// -------------------------------------------------------

/**
 * Get current leaderboard.
 * @param {string} period  - "weekly" (current week pts) | "all" (total pts)
 * @param {number} limit   - max results (default 50, capped 100)
 */
async function getLeaderboard(period = "all", limit = 50) {
  if (!["weekly", "all"].includes(period)) {
    throw new Error(`Invalid period "${period}". Use "weekly" or "all".`);
  }

  if (isCacheStale()) await refreshCache();

  const data = (cache[period] || []).slice(0, limit);

  return {
    period,
    week_start: period === "weekly" ? dummy.getWeekStart() : null,
    count: data.length,
    lastRefreshed: cache.lastRefreshed,
    data,
  };
}

/**
 * Get leaderboard for a specific historical week.
 * @param {string} weekStart - 'YYYY-MM-DD' Monday of the target week
 * @param {number} limit
 */
async function getWeeklyLeaderboardForWeek(weekStart, limit = 50) {
  const data = await fetchWeeklyDataForWeek(weekStart);
  const ranked = applyRankingAlgorithm(data).slice(0, limit);

  return {
    period: "weekly",
    week_start: weekStart,
    count: ranked.length,
    data: ranked,
  };
}

/**
 * Get a single user's rank in a given period.
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

module.exports = { getLeaderboard, getWeeklyLeaderboardForWeek, getUserRank, forceRefresh };