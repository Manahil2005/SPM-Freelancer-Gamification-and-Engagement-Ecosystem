// =============================================================
// DUMMY DATABASE  (WBS 3.1, 3.2, 3.3)
// =============================================================
// PURPOSE: Acts as a stand-in until PostgreSQL is wired up.
// HOW TO REPLACE: When your real DB is ready, set
//   USE_DUMMY_DB=false in .env and wire real SQL queries
//   inside each service file where marked with: // [DB SWAP]
// =============================================================

// Simulated users with gamification data
const users = [
  {
    user_id: "u001",
    name: "Ali Hassan",
    total_points: 1850,
    level: 2,
    activity_count: 42,    // used as tiebreaker in leaderboard
    avg_rating: 4.8,       // out of 5, from Module 1
    completion_rate: 0.95, // 0.0 - 1.0, from Module 3
    trust_score: null,     // calculated dynamically
    created_at: new Date("2025-11-01"),
  },
  {
    user_id: "u002",
    name: "Sana Mir",
    total_points: 1850,    // same as u001 → tiebreaker test case
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
  trustScoreHistory,
  notifications,
  getNextNotificationId: () => `n${String(notificationCounter++).padStart(3, "0")}`,
};
