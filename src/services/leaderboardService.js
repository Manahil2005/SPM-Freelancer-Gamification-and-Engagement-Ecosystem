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

const CACHE_TTL_MS = 90000;

// ── Ranking algorithm ─────────────────────────────────────────
// Replace the applyRankingAlgorithm function (around line 20-45)
function applyRankingAlgorithm(users) {
  if (!Array.isArray(users) || users.length === 0) return [];

  const sorted = [...users].sort((a, b) => {
    // Primary: points descending
    if (b.points_for_rank !== a.points_for_rank)
      return b.points_for_rank - a.points_for_rank;
    // Secondary: activity_count descending (more active gets higher rank)
    if (b.activity_count !== a.activity_count)
      return b.activity_count - a.activity_count;
    // Tertiary: created_at ascending (older user gets higher rank)
    return new Date(a.created_at) - new Date(b.created_at);
  });

  return sorted.map((user, idx) => ({
    rank:            idx + 1,   // always unique: 1,2,3,4,5...
    user_id:         user.user_id,
    name:            user.name,
    level:           user.level,
    total_points:    user.total_points,
    points_for_rank: user.points_for_rank,
    activity_count:  user.activity_count,
  }));
}

// ── Batch-fetch all names in ONE query ───────────────────────
// Old approach fired up to 3 serial DB queries per user (21 round-trips
// for 7 users). This replaces all of that with a single query.
async function getUserNames(userIds) {
  if (!userIds.length) return {};
  try {
    const { rows } = await pool.query(
      `SELECT id,
              COALESCE(
                NULLIF(TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))), ''),
                username,
                name,
                CONCAT('User ', id)
              ) AS name
       FROM users
       WHERE id = ANY($1)`,
      [userIds]
    );
    return Object.fromEntries(rows.map(r => [String(r.id), r.name]));
  } catch (_) {
    return {};
  }
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

    const nameMap = await getUserNames(rows.map(r => String(r.user_id)));
    return rows.map(row => ({ ...row, name: nameMap[String(row.user_id)] || `User ${row.user_id}` }));

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
        COALESCE(wpl.points_earned, 0) AS points_for_rank,
        COALESCE(wpl.activity_count, 0) AS activity_count
      FROM gamification_user_progress gup
      JOIN gamification_weekly_points_log wpl ON wpl.user_id = gup.user_id
      WHERE wpl.week_start = (
        CURRENT_DATE - EXTRACT(ISODOW FROM CURRENT_DATE)::INT + 1
      )
    `);

    const nameMap = await getUserNames(rows.map(r => String(r.user_id)));
    return rows.map(row => ({
      ...row,
      name: nameMap[String(row.user_id)] || `User ${row.user_id}`,
    }));

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

    const nameMap = await getUserNames(rows.map(r => String(r.user_id)));
    return rows.map(row => ({ ...row, name: nameMap[String(row.user_id)] || `User ${row.user_id}` }));

  } catch (err) {
    console.error("[Leaderboard] fetchWeeklyDataForWeek error:", err.message);
    return [];
  }
}

// ── Cache logic ───────────────────────────────────────────────
function isCacheStale() {
  if (!cache.lastRefreshed) return true;
  return Date.now() - cache.lastRefreshed.getTime() > CACHE_TTL_MS;
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