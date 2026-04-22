// =============================================================
// src/routes/leaderboard.js
// WBS 3.1 — Leaderboard Routes
// =============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/leaderboardController");

// GET /api/leaderboard?period=all|weekly&limit=50
router.get("/", ctrl.getLeaderboard);

// GET /api/leaderboard/week/:weekStart  — historical week (YYYY-MM-DD)
router.get("/week/:weekStart", ctrl.getWeeklyLeaderboardForWeek);

// GET /api/leaderboard/user/:userId?period=all|weekly
router.get("/user/:userId", ctrl.getUserRank);

// POST /api/leaderboard/refresh  (admin: force cache refresh)
router.post("/refresh", ctrl.forceRefresh);

module.exports = router;