// =============================================================
// src/services/leaderboardService.js
// WBS 3.1 — Leaderboard Engine
// =============================================================

require("dotenv").config();
const pool = require("../db/pool");

const cache = {
  weekly: null,
  all:    null,
  lastRefreshed: null,
};

const CACHE_TTL_MINUTES = 5;

// ── Ranking algorithm ─────────────────────────────────────────
function applyRankingAlgorithm(users) {
  if (!Array.isArray(users) || users.length === 0) return [];

  const sorted = [...users].sort((a, b) => {
    if (b.points_for_rank !== a.points_for_rank)
      return b.points_for_rank - a.points_for_rank;
    if (b.activity_count !== a.activity_count)
      return b.activity_count - a.activity_count;
    return new Date(a.created_at) - new Date(b.created_at);
  });

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
      total_points:    user.total_points,
      points_for_rank: user.points_for_rank,
      activity_count:  user.activity_count,
    };
  });
}

// ── Helper: get name from users table safely ──────────────────
// Tries multiple column combinations since centralized DB
// structure may vary across teams
async function getUserName(userId) {
  try {
    // Try first_name + last_name
    const r1 = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`, [userId]
    );
    if (r1.rows[0]) {
      const u = r1.rows[0];
      return `${u.first_name || ""} ${u.last_name || ""}`.trim() || `User ${userId}`;
    }
  } catch (_) {}

  try {
    // Try username column
    const r2 = await pool.query(
      `SELECT username FROM users WHERE id = $1`, [userId]
    );
    if (r2.rows[0]?.username) return r2.rows[0].username;
  } catch (_) {}

  try {
    // Try name column
    const r3 = await pool.query(
      `SELECT name FROM users WHERE id = $1`, [userId]
    );
    if (r3.rows[0]?.name) return r3.rows[0].name;
  } catch (_) {}

  return `User ${userId}`;
}

// ── Fetch all-time data ───────────────────────────────────────
async function fetchAllTimeData() {
  try {
    const { rows } = await pool.query(`
      SELECT
        user_id,
        total_points,
        total_points  AS points_for_rank,
        current_level AS level,
        activity_count,
        created_at
      FROM gamification_user_progress
      ORDER BY total_points DESC
    `);

    // Get names one by one safely
    const withNames = [];
    for (const row of rows) {
      const name = await getUserName(row.user_id);
      withNames.push({ ...row, name });
    }
    return withNames;

  } catch (err) {
    console.error("[Leaderboard] fetchAllTimeData error:", err.message);
    return [];
  }
}

// ── Fetch weekly data ─────────────────────────────────────────
async function fetchWeeklyData() {
  try {
    const { rows } = await pool.query(`
      SELECT
        gup.user_id,
        gup.total_points,
        gup.current_level  AS level,
        gup.created_at,
        wpl.points_earned  AS points_for_rank,
        wpl.activity_count,
        wpl.week_start
      FROM gamification_weekly_points_log wpl
      JOIN gamification_user_progress gup ON gup.user_id = wpl.user_id
      WHERE wpl.week_start = DATE_TRUNC('week', NOW())::DATE
    `);

    const withNames = [];
    for (const row of rows) {
      const name = await getUserName(row.user_id);
      withNames.push({ ...row, name });
    }
    return withNames;

  } catch (err) {
    console.error("[Leaderboard] fetchWeeklyData error:", err.message);
    return [];
  }
}

// ── Fetch historical week data ────────────────────────────────
async function fetchWeeklyDataForWeek(weekStart) {
  try {
    const { rows } = await pool.query(`
      SELECT
        gup.user_id,
        gup.total_points,
        gup.current_level  AS level,
        gup.created_at,
        wpl.points_earned  AS points_for_rank,
        wpl.activity_count,
        wpl.week_start
      FROM gamification_weekly_points_log wpl
      JOIN gamification_user_progress gup ON gup.user_id = wpl.user_id
      WHERE wpl.week_start = $1
    `, [weekStart]);

    const withNames = [];
    for (const row of rows) {
      const name = await getUserName(row.user_id);
      withNames.push({ ...row, name });
    }
    return withNames;

  } catch (err) {
    console.error("[Leaderboard] fetchWeeklyDataForWeek error:", err.message);
    return [];
  }
}

// ── Cache logic ───────────────────────────────────────────────
function isCacheStale() {
  if (!cache.lastRefreshed) return true;
  return Date.now() - cache.lastRefreshed.getTime() > CACHE_TTL_MINUTES * 60 * 1000;
}

async function refreshCache() {
  const [allData, weeklyData] = await Promise.all([
    fetchAllTimeData(),
    fetchWeeklyData(),
  ]);

  cache.all    = applyRankingAlgorithm(allData);
  cache.weekly = applyRankingAlgorithm(weeklyData);
  cache.lastRefreshed = new Date();

  console.log(`[Leaderboard] Cache refreshed — all: ${cache.all.length}, weekly: ${cache.weekly.length}`);
}

// ── Public methods ────────────────────────────────────────────
async function getLeaderboard(period = "all", limit = 50) {
  if (!["weekly", "all"].includes(period)) {
    throw new Error(`Invalid period "${period}". Use "weekly" or "all".`);
  }

  if (isCacheStale()) await refreshCache();

  const data = (cache[period] || []).slice(0, limit);

  let weekStart = null;
  if (period === "weekly") {
    try {
      const res = await pool.query(`SELECT DATE_TRUNC('week', NOW())::DATE AS ws`);
      weekStart = res.rows[0].ws;
    } catch (_) {}
  }

  return {
    success: true,
    period,
    week_start: weekStart,
    count: data.length,
    lastRefreshed: cache.lastRefreshed,
    data,
  };
}

async function getWeeklyLeaderboardForWeek(weekStart, limit = 50) {
  const data   = await fetchWeeklyDataForWeek(weekStart);
  const ranked = applyRankingAlgorithm(data).slice(0, limit);
  return { period: "weekly", week_start: weekStart, count: ranked.length, data: ranked };
}

async function getUserRank(userId, period = "all") {
  if (isCacheStale()) await refreshCache();
  const board = cache[period] || [];
  const entry = board.find((u) => String(u.user_id) === String(userId));
  if (!entry) return { user_id: userId, period, rank: null, message: "User not found in leaderboard." };
  return { user_id: userId, period, ...entry };
}

async function forceRefresh() {
  await refreshCache();
}

module.exports = { getLeaderboard, getWeeklyLeaderboardForWeek, getUserRank, forceRefresh };