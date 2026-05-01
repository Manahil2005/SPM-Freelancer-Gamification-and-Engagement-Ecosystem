// ============================================================
// controllers/gamificationController.js
// Module 11 — Gamification Controller
// ============================================================

const gService = require("../services/gamificationService");
const db       = require("../db/pool");

// ============================================================
// WBS 2.1.2 — Points Award API (POST /api/gamification/points/award)
// 🔄 Updated for new DB schema:
//    admin_audit_logs → gamification_admin_audit_logs
//    admin_id (VARCHAR) → admin_id (INTEGER FK to users)
//    columns: (admin_id, action, target_user, ip_address)
//           → (admin_id, action, target_user_id, ip_address)
// ============================================================
const handleAwardPoints = async (req, res) => {
    try {
        // WBS 5.1.5: Input Sanitization
        const userId     = req.body.user_id;
        const actionType = String(req.body.action_type || "").trim();
        const points     = parseInt(req.body.points);

        if (!userId || !actionType || isNaN(points)) {
            return res.status(400).json({ success: false, message: "Missing or invalid fields" });
        }

        const result = await gService.awardPoints(userId, actionType, points);

        // ✅ WBS 2.2 — Evaluate badges after every point award
        // Runs asynchronously; errors are logged but do not fail the response
        gService.evaluateBadges(userId).catch(err =>
            console.error("[Badge Engine] Evaluation failed for user", userId, err.message)
        );

        // WBS 5.1.3: Security Audit Logging — admin actions only
        // 🔄 Updated: table gamification_admin_audit_logs
        //             admin_id is an integer (FK to users), not 'admin_01'
        //             column target_user_id (not target_user)
        if (req.userRole === "admin" || req.headers["x-user-role"] === "admin") {
            const adminId = req.userId || null; // set by auth middleware
            await db.query(
                `INSERT INTO gamification_admin_audit_logs
                     (admin_id, action, target_user_id, ip_address)
                 VALUES ($1, $2, $3, $4)`,
                [adminId, `Manual Point Award: ${actionType}`, userId, req.ip]
            );
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// ✅ WBS 2.2.3 — Get User Badges
// GET /api/gamification/user/:userId/badges
// ============================================================
const handleGetUserBadges = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const badges = await gService.getUserBadges(userId);
        res.status(200).json({ success: true, data: badges });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// ✅ WBS 5.1.4 — User Profile Endpoint (consumed by Module 1)
// GET /api/gamification/user/:userId/profile
// Returns points, level, trust_score, top 3 badges
// ============================================================
const handleGetUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const profile = await gService.getUserProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// ============================================================
// ✅ WBS 4.2 — Onboarding Controllers
// ============================================================

// GET /api/gamification/user/:userId/onboarding
const handleGetOnboarding = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        const progress = await gService.getOnboardingProgress(userId);
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// POST /api/gamification/user/:userId/onboarding/:stepCode
const handleCompleteOnboardingStep = async (req, res) => {
    try {
        const userId   = parseInt(req.params.userId);
        const stepCode = String(req.params.stepCode || "").trim().toUpperCase();

        if (isNaN(userId) || !stepCode) {
            return res.status(400).json({ success: false, message: "Invalid userId or stepCode" });
        }

        const result = await gService.completeOnboardingStep(userId, stepCode);

        if (result.alreadyCompleted) {
            return res.status(200).json({
                success: true,
                message: "Step already completed",
                data:    result
            });
        }

        // Evaluate badges after onboarding step
        gService.evaluateBadges(userId).catch(err =>
            console.error("[Badge Engine] Evaluation failed for user", userId, err.message)
        );

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// ✅ WBS 5.1.2 — Admin: Get Audit Logs
// GET /api/gamification/admin/audit-logs
// 🔄 Updated: table gamification_admin_audit_logs
// ============================================================
const handleGetAuditLogs = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT log_id, admin_id, action, target_user_id, ip_address, created_at
             FROM gamification_admin_audit_logs
             ORDER BY created_at DESC
             LIMIT 100`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    handleAwardPoints,
    handleGetUserBadges,
    handleGetUserProfile,
    handleGetOnboarding,
    handleCompleteOnboardingStep,
    handleGetAuditLogs
};