// ============================================================
// services/gamificationService.js
// Module 11 — Gamification Service
// UPDATED: Auto-creates progress for any user
// ============================================================
const { forceRefresh } = require("./leaderboardService");
const db = require("../db/pool");

// ============================================================
// HELPER: Ensure user has gamification progress row
// Auto-creates if missing (critical for centralized DB)
// ============================================================
const ensureUserProgress = async (userId, client = null) => {
    const queryClient = client || db;
    
    try {
        // Check if user exists in users table first
        const userCheck = await queryClient.query(
            `SELECT id FROM users WHERE id = $1`,
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            throw new Error(`User ${userId} does not exist in users table`);
        }
        
        // Check if progress exists
        const progressCheck = await queryClient.query(
            `SELECT user_id FROM gamification_user_progress WHERE user_id = $1`,
            [userId]
        );
        
        if (progressCheck.rows.length === 0) {
            // Auto-create progress row
            await queryClient.query(
                `INSERT INTO gamification_user_progress 
                 (user_id, total_points, current_level, activity_count, created_at, updated_at)
                 VALUES ($1, 0, 1, 0, NOW(), NOW())
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            );
            console.log(`[Gamification] Auto-created progress for user ${userId}`);
        }
        
        return true;
    } catch (error) {
        console.error(`[Gamification] Error ensuring progress for user ${userId}:`, error.message);
        throw error;
    }
};

// ============================================================
// WBS 2.1.3 — Points Earning Logic (Atomic Update)
// ============================================================
const awardPoints = async (userId, actionType, points) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        
        // ✅ Ensure user has progress row BEFORE updating
        await ensureUserProgress(userId, client);
        
        // WBS 2.5.2 / 2.5.3: Validate points are positive
        if (points <= 0) throw new Error("Invalid point value");

        const userRes = await client.query(
            `UPDATE gamification_user_progress
             SET total_points      = total_points + $1,
                 activity_count    = activity_count + 1,
                 last_activity_date = CURRENT_DATE,
                 updated_at        = NOW()
             WHERE user_id = $2
             RETURNING *`,
            [points, userId]
        );

      if (userRes.rows.length === 0) {
        await client.query(
            `INSERT INTO gamification_user_progress (user_id, total_points, current_level, activity_count)
            VALUES ($1, $2, 1, 1)
            ON CONFLICT (user_id) DO NOTHING`,
            [userId, points]
        );
        await client.query(
            `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
            VALUES ($1, $2, $3, $4)`,
            [userId, actionType, points, `Points awarded for: ${actionType}`]
        );
        await client.query("COMMIT");
        return { total_points: points, level: 1 };
    }

        const user = userRes.rows[0];

        await client.query(
            `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
             VALUES ($1, $2, $3, $4)`,
            [userId, actionType, points, `Points awarded for: ${actionType}`]
        );

        // WBS 3.1 — Keep weekly_points_log in sync so the weekly leaderboard stays current
        await client.query(
            `INSERT INTO gamification_weekly_points_log (user_id, week_start, points_earned, activity_count)
             VALUES ($1, DATE_TRUNC('week', NOW())::DATE, $2, 1)
             ON CONFLICT (user_id, week_start)
             DO UPDATE SET
                 points_earned  = gamification_weekly_points_log.points_earned  + EXCLUDED.points_earned,
                 activity_count = gamification_weekly_points_log.activity_count + EXCLUDED.activity_count,
                 updated_at     = NOW()`,
            [userId, points]
        );

        // WBS 2.3.1 — Level Advancement Logic
        const levelRes = await client.query(
            `SELECT level_number, title FROM gamification_level_definitions
            WHERE min_points <= $1
            ORDER BY min_points DESC
            LIMIT 1`,
            [user.total_points]
        );
        const newLevel = levelRes.rows.length > 0 ? levelRes.rows[0].level_number : 1;
        const newLabel = levelRes.rows.length > 0 ? levelRes.rows[0].title : "Beginner";

        if (newLevel > user.current_level) {
            await client.query(
                `UPDATE gamification_user_progress SET current_level = $1 WHERE user_id = $2`,
                [newLevel, userId]
            );

            await _createNotification(client, {
                userId,
                type:    "level_up",
                title:   "Level Up!",
                message: `Congratulations! You've reached Level ${newLevel}: ${newLabel}`
            });
        }

        await client.query("COMMIT");
        await forceRefresh(); // ← bust the leaderboard cache immediately
        return { total_points: user.total_points, level: newLevel, points_awarded: points };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// ============================================================
// ✅ WBS 2.2 — Badge Rules Engine
// ============================================================
const evaluateBadges = async (userId) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        
        // ✅ Ensure user has progress
        await ensureUserProgress(userId, client);

        const progressRes = await client.query(
    `SELECT gup.total_points,
            gup.current_level,
            gup.activity_count,
            gup.avg_rating,
            gup.completion_rate,
            gup.streak_days,
            (SELECT COUNT(*) FROM projects
             WHERE freelancer_id = $1 AND status = 'completed') AS completed_projects,
            (SELECT COUNT(*) FROM gamification_user_challenges guc
             JOIN gamification_challenges gc ON gc.id = guc.challenge_id
             WHERE guc.user_id = $1 AND guc.status = 'completed') AS completed_challenges,
            COALESCE(guc_ob.status = 'completed', false) AS onboarding_completed
     FROM gamification_user_progress gup
     LEFT JOIN gamification_user_challenges guc_ob
        ON guc_ob.user_id = gup.user_id
        AND guc_ob.challenge_id = (
            SELECT id FROM gamification_challenges
            WHERE challenge_code = 'ONBOARDING'
            LIMIT 1
        )
            WHERE gup.user_id = $1`,
            [userId]
        );
        if (progressRes.rows.length === 0) return [];

        const stats = progressRes.rows[0];

        const BADGE_RULES = [
            {
                code:      "FIRST_PROJECT",
                condition: () => parseInt(stats.completed_projects) >= 1,
                reason:    "Completed first project"
            },
            {
                code:      "RISING_STAR",
                condition: () => parseInt(stats.total_points) >= 1000,
                reason:    "Earned 1000+ total points"
            },
            {
                code:      "CONSISTENT_PERFORMER",
                condition: () => parseInt(stats.activity_count) >= 10,
                reason:    "10+ activities logged"
            },
            {
                code:      "TOP_RATED",
                condition: () => parseFloat(stats.avg_rating) >= 4.5,
                reason:    "Maintained 4.5+ average rating"
            },
            {
                code:      "CHALLENGE_MASTER",
                condition: () => parseInt(stats.completed_challenges) >= 3,
                reason:    "Completed 3+ challenges"
            },
            {
                code:      "ONBOARDING_COMPLETE",
                condition: () => stats.onboarding_completed === true,
                reason:    "Completed the full onboarding process"
            }
        ];

        const awarded = [];

        for (const rule of BADGE_RULES) {
            if (!rule.condition()) continue;

            const badgeRes = await client.query(
                `SELECT id, points_awarded FROM gamification_badges
                 WHERE badge_code = $1 AND is_active = TRUE`,
                [rule.code]
            );
            if (badgeRes.rows.length === 0) continue;

            const badge = badgeRes.rows[0];

            const alreadyHeld = await client.query(
                `SELECT 1 FROM gamification_user_badges
                 WHERE user_id = $1 AND badge_id = $2`,
                [userId, badge.id]
            );
            if (alreadyHeld.rows.length > 0) continue;

            await client.query(
                `INSERT INTO gamification_user_badges (user_id, badge_id)
                 VALUES ($1, $2) ON CONFLICT (user_id, badge_id) DO NOTHING`,
                [userId, badge.id]
            );

            if (badge.points_awarded > 0) {
                await client.query(
                    `UPDATE gamification_user_progress
                     SET total_points = total_points + $1, updated_at = NOW()
                     WHERE user_id = $2`,
                    [badge.points_awarded, userId]
                );
                await client.query(
                    `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
                     VALUES ($1, $2, $3, $4)`,
                    [userId, "badge_reward", badge.points_awarded, `Badge bonus: ${rule.code}`]
                );
            }

            await _createNotification(client, {
                userId,
                type:    "badge",
                title:   "Badge Unlocked!",
                message: `You've earned the "${rule.code.replace(/_/g, " ")}" badge! ${rule.reason}`
            });

            awarded.push(rule.code);
        }

        await client.query("COMMIT");
        return awarded;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// ============================================================
// ✅ WBS 2.2.3 — Achievement Tracking APIs
// ============================================================
const getUserBadges = async (userId) => {
    await ensureUserProgress(userId);
    
    const res = await db.query(
        `SELECT gb.badge_code,
                gb.name,
                gb.description,
                gb.category,
                gb.icon_url,
                gb.points_awarded,
                gub.unlocked_at,
                gub.displayed_on_profile
         FROM gamification_user_badges gub
         JOIN gamification_badges gb ON gb.id = gub.badge_id
         WHERE gub.user_id = $1
         ORDER BY gub.unlocked_at DESC`,
        [userId]
    );
    return res.rows;
};

// ============================================================
// ✅ WBS 5.1.4 — User Profile Data Endpoint
// ============================================================
const getUserProfile = async (userId) => {
    await ensureUserProgress(userId);
    
    const progressRes = await db.query(
        `SELECT total_points, current_level, activity_count,
                avg_rating, completion_rate, trust_score
         FROM gamification_user_progress
         WHERE user_id = $1`,
        [userId]
    );

    if (progressRes.rows.length === 0) {
        throw new Error(`User ${userId} not found in gamification_user_progress`);
    }

    const progress = progressRes.rows[0];

    const badgesRes = await db.query(
        `SELECT gb.badge_code, gb.name, gb.icon_url, gub.unlocked_at
         FROM gamification_user_badges gub
         JOIN gamification_badges gb ON gb.id = gub.badge_id
         WHERE gub.user_id = $1 AND gub.displayed_on_profile = TRUE
         ORDER BY gub.unlocked_at DESC
         LIMIT 3`,
        [userId]
    );

    return {
        userId,
        total_points:    progress.total_points,
        current_level:   progress.current_level,
        activity_count:  progress.activity_count,
        avg_rating:      progress.avg_rating,
        completion_rate: progress.completion_rate,
        trust_score:     progress.trust_score,
        top_badges:      badgesRes.rows
    };
};

// ============================================================
// NEW: Ensure all users have progress (for scheduled jobs)
// ============================================================
const ensureAllUsersHaveProgress = async () => {
    try {
        const result = await db.query(`
            INSERT INTO gamification_user_progress (user_id, total_points, current_level, activity_count, created_at, updated_at)
            SELECT id, 0, 1, 0, NOW(), NOW()
            FROM users
            WHERE NOT EXISTS (
                SELECT 1 FROM gamification_user_progress WHERE user_id = users.id
            )
            ON CONFLICT (user_id) DO NOTHING
            RETURNING user_id
        `);
        
        if (result.rows.length > 0) {
            console.log(`[Gamification] Created progress for ${result.rows.length} new users`);
        }
        
        return result.rows.length;
    } catch (error) {
        console.error("[Gamification] Error ensuring all users have progress:", error);
        return 0;
    }
};

// ============================================================
// Internal helper — create gamification notification
// ============================================================
const _createNotification = async (client, { userId, type, title, message }) => {
    await client.query(
        `INSERT INTO gamification_notifications
             (user_id, notification_type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [userId, type, title, message]
    );
};

module.exports = {
    awardPoints,
    evaluateBadges,
    getUserBadges,
    getUserProfile,
    ensureAllUsersHaveProgress,
    ensureUserProgress
};