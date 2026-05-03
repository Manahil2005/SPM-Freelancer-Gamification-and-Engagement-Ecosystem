// ============================================================
// controllers/gamificationController.js
// Module 11 — Gamification Controller
//
// ONBOARDING REFACTOR (no new tables):
//   user_onboarding table REMOVED.
//   All onboarding state now lives in existing tables:
//
//   ┌─────────────────────────┬──────────────────────────────────────────┐
//   │ Onboarding concept      │ Where it lives now                       │
//   ├─────────────────────────┼──────────────────────────────────────────┤
//   │ Has user started?       │ gamification_user_challenges row exists  │
//   │ Has user completed?     │ guc.status = 'completed'                 │
//   │ Current step (1-6)      │ guc.current_progress                     │
//   │ Permanent done gate     │ guc.status='completed'+completed_date    │
//   │ Selected role           │ users.role (written directly)            │
//   │ Awarded badge           │ gamification_user_badges (inserted)      │
//   │ Points accumulated      │ gamification_points_ledger (summed)      │
//   │ started_at / done_at    │ guc.start_date / guc.completed_date      │
//   └─────────────────────────┴──────────────────────────────────────────┘
//
//   REQUIRED one-time SQL seed (add to SPM_Centralized_Db.sql):
//   INSERT INTO gamification_challenges
//       (challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required)
//   VALUES
//       ('ONBOARDING', 'Platform Onboarding', 'Complete the one-time platform onboarding tour', 6, 410, 0, 'onboarding', 'complete_onboarding')
//   ON CONFLICT (challenge_code) DO NOTHING;
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
// INTERNAL HELPER — fetch the ONBOARDING challenge id
// Cached after first call to avoid repeated lookups.
// ============================================================
let _onboardingChallengeId = null;
const _getOnboardingChallengeId = async (client) => {
    if (_onboardingChallengeId) return _onboardingChallengeId;
    const res = await (client || db).query(
        `SELECT id FROM gamification_challenges WHERE challenge_code = 'ONBOARDING' LIMIT 1`
    );
    if (res.rows.length === 0) {
        throw new Error("ONBOARDING challenge not seeded. Run the seed INSERT for gamification_challenges.");
    }
    _onboardingChallengeId = res.rows[0].id;
    return _onboardingChallengeId;
};

// ============================================================
// INTERNAL HELPER — fetch a user's onboarding challenge row
// Returns null if the user has never started onboarding.
// ============================================================
const _getOnboardingRow = async (client, userId, challengeId) => {
    const res = await (client || db).query(
        `SELECT guc.id, guc.current_progress, guc.status,
                guc.start_date, guc.completed_date
         FROM gamification_user_challenges guc
         WHERE guc.user_id = $1 AND guc.challenge_id = $2`,
        [userId, challengeId]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
};

// ============================================================
// WBS 4.2 — ONBOARDING GATE CHECK
// GET /api/gamification/onboarding/status
//
// Reads from gamification_user_challenges (challenge_code=ONBOARDING):
//   - No row           → never started  → completed: false, currentStep: 1
//   - status=active    → in progress    → completed: false, currentStep: current_progress
//   - status=completed → done forever   → completed: true
// ============================================================
const handleGetOnboardingStatus = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const challengeId = await _getOnboardingChallengeId();
        const row = await _getOnboardingRow(null, userId, challengeId);

        if (!row) {
            // User has never touched onboarding
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

        const completed = row.status === 'completed';

        // Derive totalPoints from ledger
        const ledgerRes = await db.query(
            `SELECT COALESCE(SUM(points), 0) AS total
             FROM gamification_points_ledger
             WHERE user_id = $1 AND action_type LIKE 'onboarding_step_%'`,
            [userId]
        );

        // Derive selectedRole from users table
        const userRes = await db.query(
            `SELECT role FROM users WHERE id = $1`,
            [userId]
        );

        // Derive most recent onboarding badge from gamification_user_badges
        // (badges awarded during onboarding have category matching onboarding badge codes)
        const badgeRes = await db.query(
            `SELECT gb.badge_code
             FROM gamification_user_badges gub
             JOIN gamification_badges gb ON gb.id = gub.badge_id
             WHERE gub.user_id = $1
             ORDER BY gub.unlocked_at DESC
             LIMIT 1`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: {
                completed:    completed,
                currentStep:  row.current_progress || 1,
                totalPoints:  parseInt(ledgerRes.rows[0].total),
                selectedRole: userRes.rows[0]?.role || null,
                awardedBadge: badgeRes.rows[0]?.badge_code || null,
                startedAt:    row.start_date,
                completedAt:  row.completed_date,
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
// State machine stored in gamification_user_challenges:
//   current_progress = step number (1–6)
//   status           = 'active' | 'completed'
//   completed_date   = stamped when DONE is sent
//
// IDEMPOTENCY: points checked via gamification_points_ledger
//   action_type = 'onboarding_step_<stepcode>'
// ============================================================
const handleCompleteOnboardingStep = async (req, res) => {
    const client = await db.connect();
    try {
        const userId = req.userId;
        const { stepCode, stepData } = req.body;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const VALID_STEPS = ['INTRO', 'ABOUT', 'ROLE', 'MODULES', 'BADGE', 'DONE'];
        if (!VALID_STEPS.includes(stepCode)) {
            return res.status(400).json({ success: false, message: "Invalid step code" });
        }

        await client.query("BEGIN");

        const challengeId = await _getOnboardingChallengeId(client);

        // ── 1. GATE: if onboarding already completed, reject silently ──
        const existingRow = await _getOnboardingRow(client, userId, challengeId);

        if (existingRow && existingRow.status === 'completed') {
            await client.query("ROLLBACK");
            return res.status(200).json({
                success: true,
                alreadyCompleted: true,
                message: "Onboarding already completed. This step was ignored.",
                data: { stepCompleted: stepCode, pointsAwarded: 0, totalOnboardingPoints: 0 }
            });
        }

        // ── 2. UPSERT gamification_user_progress (FIXED) ──
        // Use INSERT with ON CONFLICT to handle existing rows gracefully
        await client.query(
            `INSERT INTO gamification_user_progress
                 (user_id, total_points, current_level, activity_count)
             VALUES ($1, 0, 1, 0)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // ── 3. Upsert gamification_user_challenges row ──
        const stepToNumber = { INTRO: 1, ABOUT: 2, ROLE: 3, MODULES: 4, BADGE: 5, DONE: 6 };
        const stepNumber = stepToNumber[stepCode];

        if (!existingRow) {
            // First call ever — create the row
            await client.query(
                `INSERT INTO gamification_user_challenges
                     (user_id, challenge_id, current_progress, status)
                 VALUES ($1, $2, $3, 'active')
                 ON CONFLICT (user_id, challenge_id) DO NOTHING`,
                [userId, challengeId, stepNumber]
            );
        } else {
            // Only advance forward, never backward
            if (stepNumber > existingRow.current_progress) {
                await client.query(
                    `UPDATE gamification_user_challenges
                     SET current_progress = $1, last_updated = NOW()
                     WHERE user_id = $2 AND challenge_id = $3`,
                    [stepNumber, userId, challengeId]
                );
            }
        }

        // ── 4. IDEMPOTENCY: has this step already been awarded points? ──
        const ledgerAction = `onboarding_step_${stepCode.toLowerCase()}`;
        const alreadyAwarded = await client.query(
            `SELECT 1 FROM gamification_points_ledger
             WHERE user_id = $1 AND action_type = $2 LIMIT 1`,
            [userId, ledgerAction]
        );

        let pointsAwarded = 0;

        if (alreadyAwarded.rows.length === 0) {
            // ── 5. Calculate points per step ──
            switch (stepCode) {
                case 'INTRO':
                    // No points — just tracking
                    break;

                case 'ABOUT':
                    pointsAwarded = 50;
                    break;

                case 'ROLE':
                    pointsAwarded = 100;
                    if (stepData?.role) {
                        const validRoles = ['freelancer', 'client', 'admin'];
                        if (validRoles.includes(stepData.role.toLowerCase())) {
                            await client.query(
                                `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
                                [stepData.role.toLowerCase(), userId]
                            );
                        }
                    }
                    break;

                case 'MODULES': {
                    const moduleCount = parseInt(stepData?.moduleCount) || 0;
                    pointsAwarded = moduleCount * 10;
                    if (stepData?.hasExplorerBonus) pointsAwarded += 50;
                    break;
                }

                case 'BADGE': {
                    pointsAwarded = 50;  
                    const badgeCode = stepData?.badgeCode || 'ONBOARDING_COMPLETE';
                    const badgeRow = await client.query(
                        `SELECT id, points_awarded FROM gamification_badges
                        WHERE badge_code = $1 AND is_active = TRUE`,
                        [badgeCode]
                    );
                    if (badgeRow.rows.length > 0) {
                        const badge = badgeRow.rows[0];
                        // Use the badge's points_awarded from the database
                        pointsAwarded = badge.points_awarded;
                        
                        await client.query(
                            `INSERT INTO gamification_user_badges (user_id, badge_id)
                            VALUES ($1, $2) ON CONFLICT (user_id, badge_id) DO NOTHING`,
                            [userId, badge.id]
                        );
                        await client.query(
                            `INSERT INTO gamification_notifications
                                (user_id, notification_type, title, message)
                            VALUES ($1, 'badge', $2, $3)`,
                            [userId, '🎉 Welcome Aboard! 🎉',
                            `You earned the "${badgeCode.replace(/_/g, ' ')}" badge for completing onboarding! +${pointsAwarded} XP`]
                        );
                    }
                    break;
                }

                case 'DONE':
                    break;
            }

            // ── 6. Credit points if any (FIXED - always update, never insert) ──
            if (pointsAwarded > 0) {
                // Use UPDATE instead of INSERT for points
                const updateResult = await client.query(
                    `UPDATE gamification_user_progress
                     SET total_points   = total_points + $1,
                         activity_count = activity_count + 1,
                         updated_at     = NOW()
                     WHERE user_id = $2
                     RETURNING total_points`,
                    [pointsAwarded, userId]
                );

                // If update affected no rows, insert (should not happen due to earlier UPSERT)
                if (updateResult.rows.length === 0) {
                    await client.query(
                        `INSERT INTO gamification_user_progress
                             (user_id, total_points, current_level, activity_count)
                         VALUES ($1, $2, 1, 1)`,
                        [userId, pointsAwarded]
                    );
                }

                await client.query(
                    `INSERT INTO gamification_points_ledger
                         (user_id, action_type, points, description)
                     VALUES ($1, $2, $3, $4)`,
                    [userId, ledgerAction, pointsAwarded, `Onboarding step: ${stepCode}`]
                );

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
        }

        // ── 7. DONE step: stamp permanent gate ──
        if (stepCode === 'DONE') {
            await client.query(
                `UPDATE gamification_user_challenges
                 SET status         = 'completed',
                     completed_date = NOW(),
                     current_progress = 6,
                     last_updated   = NOW()
                 WHERE user_id = $1 AND challenge_id = $2`,
                [userId, challengeId]
            );

            gService.evaluateBadges(userId).catch(err =>
                console.error("[Badge Engine] Post-onboarding eval failed:", err.message)
            );
        }

        // ── 8. Read final onboarding points from ledger for response ──
        const finalPoints = await client.query(
            `SELECT COALESCE(SUM(points), 0) AS total
             FROM gamification_points_ledger
             WHERE user_id = $1 AND action_type LIKE 'onboarding_step_%'`,
            [userId]
        );
        const totalOnboardingPoints = parseInt(finalPoints.rows[0].total);

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            data: {
                stepCompleted: stepCode,
                pointsAwarded,
                totalOnboardingPoints,
                onboardingComplete: stepCode === 'DONE',
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
//
// Writes role directly to users.role.
// Guard: rejects if onboarding challenge row is already 'completed'.
// ============================================================
const handleSelectRole = async (req, res) => {
    try {
        const userId = req.userId;
        const { role } = req.body;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const validRoles = ['freelancer', 'client', 'admin'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Must be freelancer, client, or admin."
            });
        }

        // Guard: no role changes after onboarding is completed
        const challengeId = await _getOnboardingChallengeId();
        const row = await _getOnboardingRow(null, userId, challengeId);
        if (row && row.status === 'completed') {
            return res.status(409).json({
                success: false,
                message: "Onboarding already completed. Role cannot be changed via onboarding."
            });
        }

        // Write role to users table
        const result = await db.query(
            `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, role`,
            [role.toLowerCase(), userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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
//
// Returns overall gamification progress + recent badges.
// NOTE: userId comes from URL param — used for profile views.
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
                totalPoints:   progress.rows[0]?.total_points   || 0,
                level:         progress.rows[0]?.current_level  || 1,
                activityCount: progress.rows[0]?.activity_count || 0,
                trustScore:    progress.rows[0]?.trust_score    || 0,
                badges:        badges.rows
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
    handleAwardPoints,
    handleGetUserBadges,
    handleGetUserProfile,
    handleGetAuditLogs,
    handleGetOnboardingStatus,
    handleCompleteOnboardingStep,
    handleSelectRole,
    handleGetOnboardingProgress,
    handleGetOnboarding,
};