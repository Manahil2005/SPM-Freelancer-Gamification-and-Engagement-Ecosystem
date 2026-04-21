// =============================================================
// src/index.js
// Module 11 — Gamification Backend Entry Point
// =============================================================
// Starts the Express server, mounts all routes, and registers
// the node-cron job that refreshes the leaderboard cache every
// 5 minutes (WBS 3.1.3).
// =============================================================

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const cron     = require("node-cron");

const leaderboardRoutes   = require("./routes/leaderboard");
const trustScoreRoutes    = require("./routes/trustScore");
const notificationRoutes  = require("./routes/notifications");
const leaderboardService  = require("./services/leaderboardService");

const app  = express();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------
// Global Middleware
// -------------------------------------------------------
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// -------------------------------------------------------
// Health Check
// -------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    module: "Module 11 — Freelancer Engagement & Gamification",
    mode: process.env.USE_DUMMY_DB === "true" ? "DUMMY DB" : "REAL DB (PostgreSQL)",
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------
// Mount Routes
// -------------------------------------------------------
// WBS 3.1 — Leaderboard
app.use("/api/leaderboard", leaderboardRoutes);

// WBS 3.2 — Trust Score  (grouped under /api/user)
app.use("/api/user", trustScoreRoutes);

// WBS 3.3 — Notifications
app.use("/api/notifications", notificationRoutes);

// -------------------------------------------------------
// 404 Handler
// -------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// -------------------------------------------------------
// Global Error Handler
// -------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({ success: false, error: "Unexpected server error." });
});

// -------------------------------------------------------
// node-cron: Leaderboard Cache Refresh (WBS 3.1.3)
// Runs every 5 minutes to keep the in-memory leaderboard
// snapshot up to date without blocking API requests.
// -------------------------------------------------------
cron.schedule("*/5 * * * *", async () => {
  try {
    await leaderboardService.forceRefresh();
  } catch (err) {
    console.error("[CRON] Leaderboard refresh failed:", err.message);
  }
});

// -------------------------------------------------------
// Start Server
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log("================================================");
  console.log(`  Module 11 Backend running on port ${PORT}`);
  console.log(`  Mode: ${process.env.USE_DUMMY_DB === "true" ? "DUMMY DB" : "PostgreSQL"}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log("================================================");
});

module.exports = app;
