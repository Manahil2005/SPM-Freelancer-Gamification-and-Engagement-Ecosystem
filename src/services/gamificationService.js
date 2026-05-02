// ============================================================
// services/gamificationService.js
// Module 11 — Gamification Service
// ============================================================

const db = require("../db/pool");

// 🔄 Updated for new DB schema (WBS 2.5.1 / 2.5.2)
// Level config now sourced from gamification_level_definitions table.
// Fallback hardcoded config kept for startup before DB seed.
//const LEVEL_CONFIG = [
//    { level: 1, minPoints: 0,    label: "Beginner"     },
//    { level: 2, minPoints: 500,  label: "Intermediate" },
//    { level: 3, minPoints: 1500, label: "Advanced"     }
//];

// ============================================================
// WBS 2.1.3 — Points Earning Logic (Atomic Update)
// 🔄 Updated: user_progress  → gamification_user_progress
//             total_points   → total_points         (same)
//             activity_count → activity_count       (same)
//             level          → current_level
//             points_ledger  → gamification_points_ledger
//             ledger columns: (user_id, action_type, points)
//                           → (user_id, action_type, points, description)
// ============================================================
const awardPoints = async (userId, actionType, points) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // WBS 2.5.2 / 2.5.3: Validate points are positive
        if (points <= 0) throw new Error("Invalid point value");

        // 🔄 Updated for new DB schema — table: gamification_user_progress
        //    column: current_level (was: level), last_activity_date added
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
            throw new Error(`User with ID ${userId} not found in gamification_user_progress table.`);
        }

        const user = userRes.rows[0];

        // 🔄 Updated for new DB schema — table: gamification_points_ledger
        //    PK is ledger_id (bigserial), added description column
        await client.query(
            `INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
             VALUES ($1, $2, $3, $4)`,
            [userId, actionType, points, `Points awarded for: ${actionType}`]
        );

        // WBS 2.3.1 — Level Advancement Logic
        // 🔄 Updated: current_level column (was: level)
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

            // ✅ WBS 3.3 — Trigger level-up notification
            await _createNotification(client, {
                userId,
                type:    "level_up",
                title:   "Level Up!",
                message: `Congratulations! You've reached Level ${newLevel}: ${LEVEL_CONFIG[newLevel - 1].label}`
            });
        }

        await client.query("COMMIT");
        return { total_points: user.total_points, level: newLevel };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// ============================================================
// ✅ WBS 2.2 — Badge Rules Engine
// Evaluates all 5 badge conditions for a user and
// automatically awards any badges not yet held.
// ============================================================
const evaluateBadges = async (userId) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Fetch user progress data needed for badge evaluation
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
                     WHERE guc.user_id = $1 AND guc.status = 'completed') AS completed_challenges
             FROM gamification_user_progress gup
             WHERE gup.user_id = $1`,
            [userId]
        );

        if (progressRes.rows.length === 0) return [];

        const stats = progressRes.rows[0];

        // ✅ WBS 2.2.1 — Badge trigger conditions
        // Each badge has a defined rule condition:
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
            }
        ];

        const awarded = [];

        for (const rule of BADGE_RULES) {
            if (!rule.condition()) continue;

            // Lookup badge definition
            const badgeRes = await client.query(
                `SELECT id, points_awarded FROM gamification_badges
                 WHERE badge_code = $1 AND is_active = TRUE`,
                [rule.code]
            );
            if (badgeRes.rows.length === 0) continue;

            const badge = badgeRes.rows[0];

            // ✅ WBS 2.2.2 — Automated Badge Awarding Engine
            // Check if badge already held (unique constraint protects DB, but
            // we skip gracefully here to avoid throwing on duplicate)
            const alreadyHeld = await client.query(
                `SELECT 1 FROM gamification_user_badges
                 WHERE user_id = $1 AND badge_id = $2`,
                [userId, badge.id]
            );
            if (alreadyHeld.rows.length > 0) continue;

            // Award the badge
            await client.query(
                `INSERT INTO gamification_user_badges (user_id, badge_id)
                 VALUES ($1, $2)`,
                [userId, badge.id]
            );

            // Award badge bonus points via ledger
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

            // ✅ WBS 3.3 — Badge notification
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
// ✅ WBS 2.2.3 — Achievement Tracking APIs (service layer)
// Returns all badges a user holds with badge metadata
// ============================================================
const getUserBadges = async (userId) => {
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
// ✅ WBS 5.1.4 — User Profile Data Endpoint (for Module 1)
// Returns combined progress: points, level, trust score,
// badges (top 3) for cross-module consumption.
// ============================================================
const getUserProfile = async (userId) => {
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

    // Top 3 displayed badges
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
// Internal helper — create gamification notification
// ✅ WBS 3.3.2 — Notification dispatcher
// 🔄 Updated: uses gamification_notifications table
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
    getUserProfile
};