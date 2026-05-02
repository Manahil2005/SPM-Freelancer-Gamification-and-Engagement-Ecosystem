// ============================================================
// routes/gamification.js
// Module 11 — Gamification Routes
// ============================================================

const express = require("express");
const router  = express.Router();
const {
     handleAwardPoints,
    handleGetUserBadges,
    handleGetUserProfile,
    handleGetOnboarding,
    handleCompleteOnboardingStep, 
    handleGetAuditLogs,
    handleGetOnboardingProgress,   
    handleSelectRole     
} = require("../controllers/gamificationController");
const { requireUserId, requireAdmin } = require("../middleware/auth");

// ============================================================
// WBS 2.1.2 — Points Award API
// WBS 5.1.6 — Session Management (via requireUserId middleware)
// POST /api/gamification/points/award
// ============================================================
router.post("/points/award", requireUserId, handleAwardPoints);

// ============================================================
// WBS 5.1.2 — Role-based Access (Admin Only)
// WBS 5.1.3 — Audit Log Retrieval
// GET /api/gamification/admin/audit-logs
// ✅ WBS 5.1.2 — Implementation Completed
// ============================================================
router.get("/admin/audit-logs", requireUserId, requireAdmin, handleGetAuditLogs);

// ============================================================
// ✅ WBS 5.1.4 — User Profile Endpoint (for Module 1)
// GET /api/gamification/user/:userId/profile
// Returns: total_points, level, trust_score, top 3 badges
// ============================================================
router.get("/user/:userId/profile", requireUserId, handleGetUserProfile);

// ============================================================
// ✅ WBS 2.2.3 — Achievement Tracking API
// GET /api/gamification/user/:userId/badges
// ============================================================
router.get("/user/:userId/badges", requireUserId, handleGetUserBadges);




// ============================================================
// ONBOARDING ENDPOINTS - 
// ============================================================

// POST /api/gamification/onboarding/complete-step
router.post("/onboarding/complete-step", requireUserId, handleCompleteOnboardingStep);

// GET /api/gamification/onboarding/:userId/progress
router.get("/onboarding/:userId/progress", requireUserId, handleGetOnboardingProgress);

// POST /api/gamification/onboarding/select-role
router.post("/onboarding/select-role", requireUserId, handleSelectRole);

module.exports = router;