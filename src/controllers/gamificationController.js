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

// Add these functions to your gamificationController.js file

// ============================================================
// ONBOARDING HANDLERS - Add these functions
// ============================================================

const handleCompleteOnboardingStep = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware
        const { stepCode, stepData } = req.body;
        
        console.log(`Processing onboarding step: ${stepCode} for user: ${userId}`);
        
        // Validate step
        const validSteps = ['INTRO', 'ABOUT', 'ROLE', 'MODULES', 'BADGE', 'DONE'];
        if (!validSteps.includes(stepCode)) {
            return res.status(400).json({ success: false, message: "Invalid step code" });
        }
        
        // Check if user exists in gamification table
        const userCheck = await db.query(
            `SELECT user_id FROM gamification_user_progress WHERE user_id = $1`,
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            console.log(`Initializing gamification progress for user: ${userId}`);
            // Initialize user progress
            await db.query(
                `INSERT INTO gamification_user_progress (user_id, total_points, current_level, activity_count)
                 VALUES ($1, $2, $3, $4)`,
                [userId, 0, 1, 0]
            );
        }
        
        // Award points based on step
        let pointsAwarded = 0;
        switch(stepCode) {
            case 'ABOUT':
                pointsAwarded = 50;
                break;
            case 'ROLE':
                pointsAwarded = 100;
                // Store selected role if provided
                if (stepData && stepData.role) {
                    await db.query(
                        `UPDATE users SET role = $1::user_role WHERE id = $2`,
                        [stepData.role, userId]
                    ).catch(err => console.log('Role update error:', err.message));
                }
                break;
            case 'MODULES':
                pointsAwarded = (stepData && stepData.moduleCount) ? stepData.moduleCount * 10 : 0;
                // Add bonus for 5+ modules
                if (stepData && stepData.hasExplorerBonus) {
                    pointsAwarded += 50;
                }
                break;
            case 'BADGE':
                pointsAwarded = 250;
                break;
        }
        
        // Award points if any
        if (pointsAwarded > 0) {
            await db.query(
                `UPDATE gamification_user_progress 
                 SET total_points = total_points + $1,
                     activity_count = activity_count + 1,
                     updated_at = NOW()
                 WHERE user_id = $2`,
                [pointsAwarded, userId]
            );
            
            // Log in points ledger
            await db.query(
                `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
                 VALUES ($1, $2, $3, $4)`,
                [userId, `onboarding_${stepCode.toLowerCase()}`, pointsAwarded, `Completed onboarding step: ${stepCode}`]
            );
            
            console.log(`Awarded ${pointsAwarded} points for step: ${stepCode}`);
        }
        
        res.status(200).json({ 
            success: true, 
            data: { 
                stepCompleted: stepCode, 
                pointsAwarded,
                totalPoints: pointsAwarded 
            } 
        });
        
    } catch (error) {
        console.error('Onboarding step error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleGetOnboardingProgress = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }
        
        // Get user's gamification progress
        const progress = await db.query(
            `SELECT total_points, current_level, activity_count, trust_score
             FROM gamification_user_progress 
             WHERE user_id = $1`,
            [userId]
        );
        
        // Get user's badges
        const badges = await db.query(
            `SELECT gb.badge_code, gb.name, gb.points_awarded, gub.unlocked_at
             FROM gamification_user_badges gub
             JOIN gamification_badges gb ON gb.id = gub.badge_id
             WHERE gub.user_id = $1
             ORDER BY gub.unlocked_at DESC
             LIMIT 5`,
            [userId]
        );
        
        res.status(200).json({
            success: true,
            data: {
                totalPoints: progress.rows[0]?.total_points || 0,
                level: progress.rows[0]?.current_level || 1,
                activityCount: progress.rows[0]?.activity_count || 0,
                trustScore: progress.rows[0]?.trust_score || 0,
                badges: badges.rows
            }
        });
        
    } catch (error) {
        console.error('Get onboarding progress error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleSelectRole = async (req, res) => {
    try {
        const userId = req.userId;
        const { role } = req.body;
        
        console.log(`Selecting role ${role} for user ${userId}`);
        
        // Validate role
        const validRoles = ['freelancer', 'client', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        
        // Update user role in users table
        const result = await db.query(
            `UPDATE users SET role = $1::user_role WHERE id = $2 RETURNING id`,
            [role, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Award points for role selection
        await db.query(
            `UPDATE gamification_user_progress 
             SET total_points = total_points + 100,
                 activity_count = activity_count + 1
             WHERE user_id = $1`,
            [userId]
        );
        
        // Log in points ledger
        await db.query(
            `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
             VALUES ($1, $2, $3, $4)`,
            [userId, 'role_selection', 100, `Selected role: ${role}`]
        );
        
        res.status(200).json({
            success: true,
            message: `Role set to ${role}`,
            pointsAwarded: 100
        });
        
    } catch (error) {
        console.error('Role selection error:', error);
        res.status(500).json({ success: false, message: error.message });
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
    handleGetAuditLogs,
    handleGetOnboardingProgress,   
    handleSelectRole    
};
