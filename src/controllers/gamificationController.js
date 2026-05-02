// ============================================================
// controllers/gamificationController.js
// Module 11 — Gamification Controller
// ============================================================

const gService = require("../services/gamificationService");
const db       = require("../db/pool");

// ============================================================
// WBS 2.1.2 — Points Award API (POST /api/gamification/points/award)
// ============================================================
const handleAwardPoints = async (req, res) => {
    try {
        const userId     = req.body.user_id;
        const actionType = String(req.body.action_type || "").trim();
        const points     = parseInt(req.body.points);

        if (!userId || !actionType || isNaN(points)) {
            return res.status(400).json({ success: false, message: "Missing or invalid fields" });
        }

        const result = await gService.awardPoints(userId, actionType, points);

        // WBS 2.2 — Evaluate badges after every point award (async, non-blocking)
        gService.evaluateBadges(userId).catch(err =>
            console.error("[Badge Engine] Evaluation failed for user", userId, err.message)
        );

        // WBS 5.1.3 — Admin audit logging
        if (req.userRole === "admin" || req.headers["x-user-role"] === "admin") {
            const adminId = req.userId || null;
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
// WBS 2.2.3 — Get User Badges
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
// WBS 5.1.4 — User Profile Endpoint
// GET /api/gamification/user/:userId/profile
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
// WBS 5.1.2 — Admin: Get Audit Logs
// GET /api/gamification/admin/audit-logs
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

// ============================================================
// WBS 4.2 — ONBOARDING GATE CHECK
// GET /api/gamification/onboarding/status
//
// PURPOSE: Called immediately after login by the frontend.
// Returns { completed: true/false, currentStep, ... }
// If completed=true the frontend MUST skip onboarding entirely.
// If completed=false the frontend shows the onboarding flow.
//
// This is the single source of truth for the "once in lifetime"
// guarantee. The frontend should NEVER show onboarding unless
// this endpoint returns completed=false.
// ============================================================
const handleGetOnboardingStatus = async (req, res) => {
    try {
        const userId = req.userId; // set by auth middleware

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const result = await db.query(
            `SELECT onboarding_completed, current_step, onboarding_points,
                    selected_role, awarded_badge_code, started_at, completed_at
             FROM user_onboarding
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // No row at all → this user has NEVER started onboarding
            return res.status(200).json({
                success: true,
                data: {
                    completed:    false,
                    currentStep:  1,
                    totalPoints:  0,
                    selectedRole: null,
                    awardedBadge: null,
                    startedAt:    null,
                    completedAt:  null,
                }
            });
        }

        const row = result.rows[0];
        return res.status(200).json({
            success: true,
            data: {
                completed:    row.onboarding_completed,
                currentStep:  row.current_step,
                totalPoints:  row.onboarding_points,
                selectedRole: row.selected_role,
                awardedBadge: row.awarded_badge_code,
                startedAt:    row.started_at,
                completedAt:  row.completed_at,
            }
        });

    } catch (error) {
        console.error("[Onboarding] Status check error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// WBS 4.2 — COMPLETE ONBOARDING STEP
// POST /api/gamification/onboarding/complete-step
//
// Body: { stepCode: "INTRO"|"ABOUT"|"ROLE"|"MODULES"|"BADGE"|"DONE",
//         stepData: { ...optional per-step payload } }
//
// STEP LOGIC:
//   INTRO    → creates the onboarding row (idempotent), no points
//   ABOUT    → +50 XP (viewing "Who We Are")
//   ROLE     → +100 XP, writes role to users table
//   MODULES  → +10 XP per module + +50 XP explorer bonus if 5+ modules
//   BADGE    → +250 XP, awards the badge to gamification_user_badges
//   DONE     → stamps onboarding_completed=TRUE (PERMANENT GATE), no extra points
//
// IDEMPOTENCY: steps can be re-sent safely; points are only
// awarded once per step (checked via points ledger action_type UNIQUE logic).
// ============================================================
const handleCompleteOnboardingStep = async (req, res) => {
    const client = await db.connect();
    try {
        const userId   = req.userId; // set by auth middleware
        const { stepCode, stepData } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const VALID_STEPS = ['INTRO', 'ABOUT', 'ROLE', 'MODULES', 'BADGE', 'DONE'];
        if (!VALID_STEPS.includes(stepCode)) {
            return res.status(400).json({ success: false, message: "Invalid step code" });
        }

        await client.query("BEGIN");

        // ── 1. GUARD: if onboarding already completed, reject silently ──
        const existingRow = await client.query(
            `SELECT onboarding_completed, current_step FROM user_onboarding WHERE user_id = $1`,
            [userId]
        );

        if (existingRow.rows.length > 0 && existingRow.rows[0].onboarding_completed === true) {
            await client.query("ROLLBACK");
            // Return success so frontend doesn't error, but flag it
            return res.status(200).json({
                success:  true,
                alreadyCompleted: true,
                message:  "Onboarding already completed. This step was ignored.",
                data: { stepCompleted: stepCode, pointsAwarded: 0, totalOnboardingPoints: 0 }
            });
        }

        // ── 2. Ensure gamification_user_progress row exists ──
        const progressCheck = await client.query(
            `SELECT user_id FROM gamification_user_progress WHERE user_id = $1`,
            [userId]
        );
        if (progressCheck.rows.length === 0) {
            await client.query(
                `INSERT INTO gamification_user_progress
                     (user_id, total_points, current_level, activity_count)
                 VALUES ($1, 0, 1, 0)`,
                [userId]
            );
        }

        // ── 3. Ensure user_onboarding row exists (INTRO step creates it) ──
        const stepToNumber = { INTRO: 1, ABOUT: 2, ROLE: 3, MODULES: 4, BADGE: 5, DONE: 6 };
        const stepNumber = stepToNumber[stepCode];

        if (existingRow.rows.length === 0) {
            await client.query(
                `INSERT INTO user_onboarding (user_id, current_step, onboarding_points)
                 VALUES ($1, $2, 0)`,
                [userId, stepNumber]
            );
        } else {
            // Only advance step forward, never backward
            if (stepNumber > existingRow.rows[0].current_step) {
                await client.query(
                    `UPDATE user_onboarding SET current_step = $1, updated_at = NOW() WHERE user_id = $2`,
                    [stepNumber, userId]
                );
            }
        }

        // ── 4. IDEMPOTENCY CHECK: has this step already been awarded? ──
        const ledgerAction = `onboarding_step_${stepCode.toLowerCase()}`;
        const alreadyAwarded = await client.query(
            `SELECT 1 FROM gamification_points_ledger
             WHERE user_id = $1 AND action_type = $2 LIMIT 1`,
            [userId, ledgerAction]
        );

        let pointsAwarded = 0;

        if (alreadyAwarded.rows.length === 0) {
            // ── 5. Calculate points for this step ──
            switch (stepCode) {
                case 'INTRO':
                    // No points for intro, just tracking
                    break;

                case 'ABOUT':
                    pointsAwarded = 50;
                    break;

                case 'ROLE':
                    pointsAwarded = 100;
                    // Write role to users table
                    if (stepData?.role) {
                        const validRoles = ['freelancer', 'client', 'admin'];
                        if (validRoles.includes(stepData.role.toLowerCase())) {
                            await client.query(
                                `UPDATE users SET role = $1 WHERE id = $2`,
                                [stepData.role.toLowerCase(), userId]
                            );
                            await client.query(
                                `UPDATE user_onboarding SET selected_role = $1 WHERE user_id = $2`,
                                [stepData.role.toLowerCase(), userId]
                            );
                        }
                    }
                    break;

                case 'MODULES':
                    // +10 XP per module explored, +50 bonus for explorer (5+ modules)
                    const moduleCount = parseInt(stepData?.moduleCount) || 0;
                    pointsAwarded = moduleCount * 10;
                    if (stepData?.hasExplorerBonus) pointsAwarded += 50;
                    break;

                case 'BADGE': {
                    pointsAwarded = 250;
                    // Award the badge to gamification_user_badges
                    const badgeCode = stepData?.badgeCode || 'CHALLENGE_MASTER';
                    const badgeRow  = await client.query(
                        `SELECT id, points_awarded FROM gamification_badges
                         WHERE badge_code = $1 AND is_active = TRUE`,
                        [badgeCode]
                    );
                    if (badgeRow.rows.length > 0) {
                        const badge = badgeRow.rows[0];
                        // Insert (ignore duplicate — user may re-submit)
                        await client.query(
                            `INSERT INTO gamification_user_badges (user_id, badge_id)
                             VALUES ($1, $2) ON CONFLICT (user_id, badge_id) DO NOTHING`,
                            [userId, badge.id]
                        );
                        // Add badge bonus points on top of the step points
                        if (badge.points_awarded > 0) {
                            pointsAwarded += badge.points_awarded;
                        }
                        // Record the badge code on the onboarding row
                        await client.query(
                            `UPDATE user_onboarding SET awarded_badge_code = $1 WHERE user_id = $2`,
                            [badgeCode, userId]
                        );
                        // Notification
                        await client.query(
                            `INSERT INTO gamification_notifications
                                 (user_id, notification_type, title, message)
                             VALUES ($1, 'badge', $2, $3)`,
                            [userId, 'Badge Unlocked!',
                             `You earned the "${badgeCode.replace(/_/g,' ')}" badge during onboarding!`]
                        );
                    }
                    break;
                }

                case 'DONE':
                    // No points — just stamps the permanent gate
                    break;
            }

            // ── 6. Credit points if any ──
            if (pointsAwarded > 0) {
                await client.query(
                    `UPDATE gamification_user_progress
                     SET total_points   = total_points + $1,
                         activity_count = activity_count + 1,
                         updated_at     = NOW()
                     WHERE user_id = $2`,
                    [pointsAwarded, userId]
                );

                await client.query(
                    `UPDATE user_onboarding
                     SET onboarding_points = onboarding_points + $1, updated_at = NOW()
                     WHERE user_id = $2`,
                    [pointsAwarded, userId]
                );

                await client.query(
                    `INSERT INTO gamification_points_ledger
                         (user_id, action_type, points, description)
                     VALUES ($1, $2, $3, $4)`,
                    [userId, ledgerAction, pointsAwarded, `Onboarding step: ${stepCode}`]
                );

                // Send points notification for meaningful awards
                if (['ABOUT', 'ROLE', 'MODULES', 'BADGE'].includes(stepCode)) {
                    await client.query(
                        `INSERT INTO gamification_notifications
                             (user_id, notification_type, title, message)
                         VALUES ($1, 'points', $2, $3)`,
                        [userId, 'XP Earned!',
                         `You earned ${pointsAwarded} XP for completing the "${stepCode}" step.`]
                    );
                }
            }
        } // end idempotency block

        // ── 7. DONE step: stamp the permanent gate ──
        if (stepCode === 'DONE') {
            await client.query(
                `UPDATE user_onboarding
                 SET onboarding_completed = TRUE,
                     completed_at         = NOW(),
                     current_step         = 6,
                     updated_at           = NOW()
                 WHERE user_id = $1`,
                [userId]
            );

            // Run badge engine one final time — catches RISING_STAR etc.
            // (async, does not block the response)
            gService.evaluateBadges(userId).catch(err =>
                console.error("[Badge Engine] Post-onboarding eval failed:", err.message)
            );
        }

        // ── 8. Read final onboarding points for response ──
        const finalRow = await client.query(
            `SELECT onboarding_points FROM user_onboarding WHERE user_id = $1`,
            [userId]
        );
        const totalOnboardingPoints = finalRow.rows[0]?.onboarding_points || 0;

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            data: {
                stepCompleted:         stepCode,
                pointsAwarded,
                totalOnboardingPoints,
                onboardingComplete:    stepCode === 'DONE',
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[Onboarding] Step completion error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// ============================================================
// WBS 4.2 — SELECT ROLE (standalone endpoint for Step 3)
// POST /api/gamification/onboarding/select-role
// Body: { role: "freelancer"|"client"|"admin" }
//
// Delegates to complete-step internally with stepCode=ROLE.
// Kept as a separate endpoint because the frontend calls it
// independently from the step completion flow.
// ============================================================
const handleSelectRole = async (req, res) => {
    try {
        const userId = req.userId;
        const { role } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const validRoles = ['freelancer', 'client', 'admin'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid role. Must be freelancer, client, or admin." });
        }

        // Guard: don't allow role change if onboarding already completed
        const statusCheck = await db.query(
            `SELECT onboarding_completed FROM user_onboarding WHERE user_id = $1`,
            [userId]
        );
        if (statusCheck.rows.length > 0 && statusCheck.rows[0].onboarding_completed === true) {
            return res.status(409).json({
                success: false,
                message: "Onboarding already completed. Role cannot be changed via onboarding."
            });
        }

        // Update role in users table
        const result = await db.query(
            `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
            [role.toLowerCase(), userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Persist selected role on the onboarding row (upsert-safe)
        await db.query(
            `UPDATE user_onboarding SET selected_role = $1, updated_at = NOW() WHERE user_id = $2`,
            [role.toLowerCase(), userId]
        );

        res.status(200).json({
            success:       true,
            message:       `Role set to ${role}`,
            pointsAwarded: 0,  // Points come from complete-step ROLE call
            data: { role: result.rows[0].role }
        });

    } catch (error) {
        console.error("[Onboarding] Role selection error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// WBS 4.2 — GET ONBOARDING PROGRESS (for mid-session resume)
// GET /api/gamification/onboarding/:userId/progress
// ============================================================
const handleGetOnboardingProgress = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const progress = await db.query(
            `SELECT total_points, current_level, activity_count, trust_score
             FROM gamification_user_progress
             WHERE user_id = $1`,
            [userId]
        );

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
                totalPoints:  progress.rows[0]?.total_points   || 0,
                level:        progress.rows[0]?.current_level  || 1,
                activityCount:progress.rows[0]?.activity_count || 0,
                trustScore:   progress.rows[0]?.trust_score    || 0,
                badges:       badges.rows
            }
        });

    } catch (error) {
        console.error("[Onboarding] Progress fetch error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── legacy alias kept for route backward-compat ──
const handleGetOnboarding = handleGetOnboardingProgress;

module.exports = {
    // Points / Badges / Profile — unchanged
    handleAwardPoints,
    handleGetUserBadges,
    handleGetUserProfile,
    handleGetAuditLogs,

    // Onboarding
    handleGetOnboardingStatus,
    handleCompleteOnboardingStep,
    handleSelectRole,
    handleGetOnboardingProgress,
    handleGetOnboarding,        
};