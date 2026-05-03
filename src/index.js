// =============================================================
// src/index.js
// Module 11 — Gamification Backend Entry Point
// =============================================================
// Starts the Express server, mounts all routes, and registers
// the node-cron job that refreshes the leaderboard cache every
// 5 minutes (WBS 3.1.3).
// Also seeds badge & onboarding challenge definitions on boot.
// =============================================================

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const cron     = require("node-cron");

const leaderboardRoutes   = require("./routes/leaderboard");
const trustScoreRoutes    = require("./routes/trustScore");
const notificationRoutes  = require("./routes/notifications");
const leaderboardService  = require("./services/leaderboardService");
const gamificationRoutes  = require("./routes/gamification");
const challengeRoutes     = require("./routes/challenges");          // ✅ WBS 2.4
const adminConfigRoutes   = require("./routes/adminConfig"); 
const gamificationController = require("./controllers/gamificationController");

// ✅ WBS 2.2.1 — Badge + Onboarding seeder (runs once on startup)
// ✅ WBS 2.4   — Timed challenge seeder
const { seedBadges, seedOnboardingChallenges, seedTimedChallenges } = require("./services/badgeService");
const { expireStaleUserChallenges } = require("./services/challengeService");

const app  = express();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------
// Global Middleware
// -------------------------------------------------------
app.use(cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "x-user-id", "x-user-role"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
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
        status:    "ok",
        module:    "Module 11 — Freelancer Engagement & Gamification",
        mode:      process.env.USE_DUMMY_DB === "true" ? "DUMMY DB" : "REAL DB (PostgreSQL)",
        timestamp: new Date().toISOString()
    });
});

app.get('/api/users/:userId/role', gamificationController.handleGetUserRole);

// -------------------------------------------------------
// Mount Routes
// -------------------------------------------------------
// WBS 3.1 — Leaderboard
app.use("/api/leaderboard", leaderboardRoutes);

// WBS 3.2 — Trust Score  (grouped under /api/user)
app.use("/api/user", trustScoreRoutes);

// WBS 3.3 — Notifications
app.use("/api/notifications", notificationRoutes);

// WBS 2.1 / 2.2 / 5.1 — Gamification
app.use("/api/gamification", gamificationRoutes);

// ✅ WBS 2.4 — Time-Based Challenges (daily / weekly / monthly)
app.use("/api/gamification", challengeRoutes);

app.use("/api/gamification/admin", adminConfigRoutes);

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

// ✅ WBS 2.4.4 — Expire stale timed challenges every hour
cron.schedule("0 * * * *", async () => {
    try {
        await expireStaleUserChallenges();
    } catch (err) {
        console.error("[CRON] Challenge expiry failed:", err.message);
    }
});

// -------------------------------------------------------
// Start Server + Seed on Boot
// ✅ WBS 2.2.1 — Badge definitions seeded at startup
// ✅ WBS 4.2   — Onboarding challenge definitions seeded
// -------------------------------------------------------
app.listen(PORT, async () => {
    console.log("================================================");
    console.log(`  Module 11 Backend running on port ${PORT}`);
    console.log(`  Mode: ${process.env.USE_DUMMY_DB === "true" ? "DUMMY DB" : "PostgreSQL"}`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log("================================================");

    // Seed badge & onboarding data — safe to run on every boot
    // (uses ON CONFLICT DO NOTHING, so it's idempotent)
    if (process.env.USE_DUMMY_DB !== "true") {
        try {
            await seedBadges();
            await seedOnboardingChallenges();
            await seedTimedChallenges();             // ✅ WBS 2.4
        } catch (err) {
            console.error("[Seeder] Failed to seed badges/challenges:", err.message);
        }
    }
});

module.exports = app;