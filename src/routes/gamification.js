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
    handleGetAuditLogs,
    handleGetOnboardingStatus,
    handleCompleteOnboardingStep,
    handleSelectRole,
    handleGetOnboardingProgress,
} = require("../controllers/gamificationController");
const { requireUserId, requireAdmin } = require("../middleware/auth");

// ============================================================
// WBS 2.1.2 — Points Award API
// POST /api/gamification/points/award
// ============================================================
router.post("/points/award", requireUserId, handleAwardPoints);

// ============================================================
// WBS 5.1.2 / 5.1.3 — Admin Audit Logs
// GET /api/gamification/admin/audit-logs
// ============================================================
router.get("/admin/audit-logs", requireUserId, requireAdmin, handleGetAuditLogs);

// ============================================================
// WBS 5.1.4 — User Profile (for Module 1)
// GET /api/gamification/user/:userId/profile
// ============================================================
router.get("/user/:userId/profile", requireUserId, handleGetUserProfile);

// ============================================================
// WBS 2.2.3 — Achievement Tracking API
// GET /api/gamification/user/:userId/badges
// ============================================================
router.get("/user/:userId/badges", requireUserId, handleGetUserBadges);

// ============================================================
// WBS 4.2 — ONBOARDING ROUTES
//
// CALL ORDER (frontend must follow this sequence):
//
//  1. GET  /onboarding/status
//       → Check if user has already done onboarding.
//         If data.completed === true → redirect to /dashboard.
//         If data.completed === false → show OnboardingPage.
//
//  2. POST /onboarding/complete-step  { stepCode: "INTRO" }
//       → Creates the onboarding row on first load.
//
//  3. POST /onboarding/select-role    { role: "freelancer" }
//       → Writes role to users table (called from Step 3 footer).
//
//  4. POST /onboarding/complete-step  { stepCode: "ABOUT" }
//  5. POST /onboarding/complete-step  { stepCode: "ROLE",    stepData: { role } }
//  6. POST /onboarding/complete-step  { stepCode: "MODULES", stepData: { moduleCount, hasExplorerBonus } }
//  7. POST /onboarding/complete-step  { stepCode: "BADGE",   stepData: { badgeCode } }
//  8. POST /onboarding/complete-step  { stepCode: "DONE" }
//       → Stamps onboarding_completed=TRUE permanently.
//         Frontend MUST call this to close the gate.
// ============================================================

// Gate check — call this right after login before rendering anything
router.get("/onboarding/status", requireUserId, handleGetOnboardingStatus);

// Step-by-step completion (covers all 6 steps including DONE)
router.post("/onboarding/complete-step", requireUserId, handleCompleteOnboardingStep);

// Standalone role selection (called from Step 3 Continue button)
router.post("/onboarding/select-role", requireUserId, handleSelectRole);

// Progress snapshot (for mid-session resume / Step 6 summary)
router.get("/onboarding/:userId/progress", requireUserId, handleGetOnboardingProgress);

module.exports = router;