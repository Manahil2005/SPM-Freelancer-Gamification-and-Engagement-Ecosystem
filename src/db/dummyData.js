// =============================================================
// DUMMY DATABASE  (WBS 3.1, 3.2, 3.3)
// =============================================================
// PURPOSE: Acts as a stand-in until PostgreSQL is wired up.
// HOW TO REPLACE: When your real DB is ready, set
//   USE_DUMMY_DB=false in .env and wire real SQL queries
//   inside each service file where marked with: // [DB SWAP]
// =============================================================

// Helper: returns the Monday (week_start) of a given date as YYYY-MM-DD string
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

const THIS_WEEK = getWeekStart();
const LAST_WEEK = getWeekStart(new Date(Date.now() - 7  * 24 * 60 * 60 * 1000));
const TWO_AGO   = getWeekStart(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));

// Simulated users with gamification data
const users = [
  {
    user_id: "u001",
    name: "Ali Hassan",
    total_points: 1850,
    level: 2,
    activity_count: 42,    // all-time activity count (tiebreaker for all-time board)
    avg_rating: 4.8,       // out of 5, from Module 1
    completion_rate: 0.95, // 0.0 - 1.0, from Module 3
    trust_score: null,     // calculated dynamically, enforced 0-100
    created_at: new Date("2025-11-01"),
  },
  {
    user_id: "u002",
    name: "Sana Mir",
    total_points: 1850,    // same as u001 -> tiebreaker test case
    level: 2,
    activity_count: 38,
    avg_rating: 4.5,
    completion_rate: 0.88,
    trust_score: null,
    created_at: new Date("2025-10-15"),
  },
  {
    user_id: "u003",
    name: "Raza Khan",
    total_points: 3200,
    level: 3,
    activity_count: 91,
    avg_rating: 4.9,
    completion_rate: 0.99,
    trust_score: null,
    created_at: new Date("2025-09-20"),
  },
  {
    user_id: "u004",
    name: "Fatima Zahra",
    total_points: 720,
    level: 1,
    activity_count: 17,
    avg_rating: 3.8,
    completion_rate: 0.72,
    trust_score: null,
    created_at: new Date("2026-01-10"),
  },
  {
    user_id: "u005",
    name: "Hamza Tariq",
    total_points: 1100,
    level: 2,
    activity_count: 25,
    avg_rating: 4.2,
    completion_rate: 0.80,
    trust_score: null,
    created_at: new Date("2025-12-05"),
  },
];

// =============================================================
// Weekly Points Log (mirrors the weekly_points_log DB table)
// =============================================================
// Each entry: { user_id, week_start (YYYY-MM-DD), points_earned, activity_count }
// UNIQUE constraint: one entry per (user_id, week_start) pair.
// Used ONLY by the weekly leaderboard - ranks on points earned
// THIS week, not total_points (which is all-time).
// =============================================================
const weeklyPointsLog = [
  // Current week
  { user_id: "u001", week_start: THIS_WEEK, points_earned: 320, activity_count: 8  },
  { user_id: "u002", week_start: THIS_WEEK, points_earned: 410, activity_count: 11 },
  { user_id: "u003", week_start: THIS_WEEK, points_earned: 890, activity_count: 23 },
  { user_id: "u004", week_start: THIS_WEEK, points_earned:  75, activity_count: 3  },
  { user_id: "u005", week_start: THIS_WEEK, points_earned: 190, activity_count: 5  },
  // Previous week
  { user_id: "u001", week_start: LAST_WEEK, points_earned: 500, activity_count: 13 },
  { user_id: "u002", week_start: LAST_WEEK, points_earned: 280, activity_count:  7 },
  { user_id: "u003", week_start: LAST_WEEK, points_earned: 950, activity_count: 25 },
  { user_id: "u005", week_start: LAST_WEEK, points_earned: 200, activity_count:  6 },
  // Two weeks ago
  { user_id: "u001", week_start: TWO_AGO,   points_earned: 400, activity_count: 10 },
  { user_id: "u003", week_start: TWO_AGO,   points_earned: 700, activity_count: 18 },
];

/**
 * Upsert weekly points for a user in the current week.
 * Mirrors the UPSERT SQL in schema.sql for the real DB.
 */
function upsertWeeklyPoints(userId, pointsDelta, activityDelta = 1) {
  const weekStart = getWeekStart();
  let entry = weeklyPointsLog.find(
    (e) => e.user_id === userId && e.week_start === weekStart
  );
  if (entry) {
    entry.points_earned  += pointsDelta;
    entry.activity_count += activityDelta;
  } else {
    entry = { user_id: userId, week_start: weekStart, points_earned: pointsDelta, activity_count: activityDelta };
    weeklyPointsLog.push(entry);
  }
  return entry;
}

// Trust score history per user
const trustScoreHistory = {
  u001: [],
  u002: [],
  u003: [],
  u004: [],
  u005: [],
};

// In-memory notification store
const notifications = [
  {
    notification_id: "n001",
    user_id: "u001",
    type: "points",
    message: "You earned 50 points for completing a project!",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    notification_id: "n002",
    user_id: "u001",
    type: "badge",
    message: "Congratulations! You earned the 'Rising Star' badge!",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    notification_id: "n003",
    user_id: "u001",
    type: "level",
    message: "Level Up! You are now Level 2 - Intermediate.",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    notification_id: "n004",
    user_id: "u002",
    type: "challenge",
    message: "New weekly challenge available: Complete 3 projects this week!",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    notification_id: "n005",
    user_id: "u003",
    type: "points",
    message: "You earned 100 points for a 5-star client rating!",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5),
  },
];

let notificationCounter = 6;

module.exports = {
  users,
  weeklyPointsLog,
  trustScoreHistory,
  notifications,
  getWeekStart,
  upsertWeeklyPoints,
  getNextNotificationId: () => `n${String(notificationCounter++).padStart(3, "0")}`,
};