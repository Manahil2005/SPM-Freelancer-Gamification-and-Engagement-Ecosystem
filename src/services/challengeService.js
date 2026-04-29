// ============================================================
// services/challengeService.js
// Module 11 — Time-Based Challenge Engine (NEW)
// ✅ WBS 2.4   — Daily / Weekly / Monthly Challenge System
// ✅ WBS 2.4.1 — Challenge Assignment & Period Management
// ✅ WBS 2.4.2 — Challenge Progress Tracking
// ✅ WBS 2.4.3 — Challenge Completion & Reward Dispatch
// ✅ WBS 2.4.4 — Challenge Expiry Handling
// ============================================================

const db = require("../db/pool");

// ============================================================
// Internal helpers
// ============================================================

/**
 * Returns the ISO start-of-period date string for a challenge type.
 * daily   → today (YYYY-MM-DD)
 * weekly  → Monday of the current ISO week
 * monthly → first day of the current month
 */
const getPeriodStart = (challengeType) => {
    const now = new Date();
    if (challengeType === "daily") {
        return now.toISOString().slice(0, 10);
    }
    if (challengeType === "weekly") {
        const day = now.getDay(); // 0 = Sun
        const diff = (day === 0) ? -6 : 1 - day; // roll back to Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        return monday.toISOString().slice(0, 10);
    }
    // monthly
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

/**
 * Returns the ISO expiry date for a given period start + expiry_days.
 */
const getExpiryDate = (periodStart, expiryDays) => {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + expiryDays);
    return d.toISOString().slice(0, 10);
};

/**
 * Inserts a gamification notification (uses a plain db query,
 * not a transaction client — for use outside transactions).
 */
const _notify = async (userId, type, title, message) => {
    await db.query(
        `INSERT INTO gamification_notifications
             (user_id, notification_type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [userId, type, title, message]
    );
};

// ============================================================
// ✅ WBS 2.4.1 — Assign (or re-use) a challenge for a user
// in the current period.
//
// Logic:
//  1. Look up the challenge definition by challenge_code.
//  2. Determine the current period start date.
//  3. Check whether a user_challenge row already exists for
//     this user + challenge + period.
//  4. If not → INSERT a new active row with expiry date.
//  5. Return the user_challenge row (existing or newly created).
// ============================================================
const assignChallenge = async (userId, challengeCode) => {
    // 1. Fetch challenge definition
    const challengeRes = await db.query(
        `SELECT id, challenge_type, expiry_days, title
         FROM gamification_challenges
         WHERE challenge_code = $1 AND is_active = TRUE`,
        [challengeCode]
    );
    if (challengeRes.rows.length === 0) {
        throw new Error(`Challenge ${challengeCode} not found or inactive`);
    }
    const challenge = challengeRes.rows[0];

    // 2. Period window
    const periodStart  = getPeriodStart(challenge.challenge_type);
    const periodExpiry = getExpiryDate(periodStart, challenge.expiry_days);

    // 3. Existing row for this period?
    const existingRes = await db.query(
        `SELECT * FROM gamification_user_challenges
         WHERE user_id = $1
           AND challenge_id = $2
           AND period_start = $3`,
        [userId, challenge.id, periodStart]
    );

    if (existingRes.rows.length > 0) {
        return { assigned: false, existing: true, data: existingRes.rows[0] };
    }

    // 4. Create new user_challenge row for this period
    const insertRes = await db.query(
        `INSERT INTO gamification_user_challenges
             (user_id, challenge_id, current_progress, status,
              period_start, expiry_date)
         VALUES ($1, $2, 0, 'active', $3, $4)
         RETURNING *`,
        [userId, challenge.id, periodStart, periodExpiry]
    );

    return { assigned: true, existing: false, data: insertRes.rows[0] };
};

// ============================================================
// ✅ WBS 2.4.1 — Bulk-assign all active timed challenges of a
// given type to a user (called by cron or on first login of period).
// ============================================================
const assignAllChallengesForPeriod = async (userId, challengeType) => {
    const challengesRes = await db.query(
        `SELECT challenge_code FROM gamification_challenges
         WHERE challenge_type = $1 AND is_active = TRUE`,
        [challengeType]
    );

    const results = [];
    for (const row of challengesRes.rows) {
        const result = await assignChallenge(userId, row.challenge_code);
        results.push({ challenge_code: row.challenge_code, ...result });
    }
    return results;
};

// ============================================================
// ✅ WBS 2.4.2 — Record progress on a timed challenge.
//
// incrementBy: how many units of work to add (default 1).
// Validates challenge is active and not expired before updating.
// If progress reaches target_count → triggers completion flow.
// ============================================================
const recordChallengeProgress = async (userId, challengeCode, incrementBy = 1) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Lock the challenge definition
        const challengeRes = await client.query(
            `SELECT id, target_count, reward_points, title, challenge_type, expiry_days
             FROM gamification_challenges
             WHERE challenge_code = $1 AND is_active = TRUE
             FOR UPDATE`,
            [challengeCode]
        );
        if (challengeRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return { skipped: true, reason: "Challenge not found or inactive" };
        }
        const challenge = challengeRes.rows[0];

        // Find the user_challenge row for the current period
        const periodStart = getPeriodStart(challenge.challenge_type);
        const ucRes = await client.query(
            `SELECT * FROM gamification_user_challenges
             WHERE user_id = $1
               AND challenge_id = $2
               AND period_start = $3
             FOR UPDATE`,
            [userId, challenge.id, periodStart]
        );

        // ✅ WBS 2.4.4 — Auto-assign if missing (lazy assignment)
        let uc;
        if (ucRes.rows.length === 0) {
            const periodExpiry = getExpiryDate(periodStart, challenge.expiry_days);
            const newUc = await client.query(
                `INSERT INTO gamification_user_challenges
                     (user_id, challenge_id, current_progress, status,
                      period_start, expiry_date)
                 VALUES ($1, $2, 0, 'active', $3, $4)
                 RETURNING *`,
                [userId, challenge.id, periodStart, periodExpiry]
            );
            uc = newUc.rows[0];
        } else {
            uc = ucRes.rows[0];
        }

        // ✅ WBS 2.4.4 — Skip expired or already-completed challenges
        if (uc.status === "completed") {
            await client.query("ROLLBACK");
            return { skipped: true, reason: "Already completed this period" };
        }
        if (uc.status === "expired" || new Date(uc.expiry_date) < new Date()) {
            await client.query(
                `UPDATE gamification_user_challenges SET status = 'expired', last_updated = NOW()
                 WHERE id = $1`,
                [uc.id]
            );
            await client.query("ROLLBACK");
            return { skipped: true, reason: "Challenge period has expired" };
        }

        // ✅ WBS 2.4.2 — Update progress
        const newProgress = Math.min(
            parseInt(uc.current_progress) + incrementBy,
            parseInt(challenge.target_count)
        );

        await client.query(
            `UPDATE gamification_user_challenges
             SET current_progress = $1,
                 last_updated     = NOW()
             WHERE id = $2`,
            [newProgress, uc.id]
        );

        const completed = newProgress >= parseInt(challenge.target_count);

        if (completed) {
            // ✅ WBS 2.4.3 — Mark complete and dispatch rewards
            await client.query(
                `UPDATE gamification_user_challenges
                 SET status = 'completed', completed_date = NOW(), last_updated = NOW()
                 WHERE id = $1`,
                [uc.id]
            );

            // Award points
            await client.query(
                `UPDATE gamification_user_progress
                 SET total_points   = total_points + $1,
                     activity_count = activity_count + 1,
                     updated_at     = NOW()
                 WHERE user_id = $2`,
                [challenge.reward_points, userId]
            );

            await client.query(
                `INSERT INTO gamification_points_ledger
                     (user_id, action_type, points, description)
                 VALUES ($1, 'challenge_complete', $2, $3)`,
                [userId, challenge.reward_points,
                 `${challenge.challenge_type} challenge completed: ${challenge.title}`]
            );

            // WBS 3.3 — Notify user
            await client.query(
                `INSERT INTO gamification_notifications
                     (user_id, notification_type, title, message)
                 VALUES ($1, 'challenge', $2, $3)`,
                [
                    userId,
                    "Challenge Complete!",
                    `You completed "${challenge.title}" and earned ${challenge.reward_points} points!`
                ]
            );

            await client.query("COMMIT");
            return {
                completed:     true,
                challenge_code: challengeCode,
                newProgress,
                target:        challenge.target_count,
                pointsAwarded: challenge.reward_points
            };
        }

        await client.query("COMMIT");
        return {
            completed:      false,
            challenge_code: challengeCode,
            newProgress,
            target:         challenge.target_count,
            remaining:      challenge.target_count - newProgress
        };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// ============================================================
// ✅ WBS 2.4.2 — Get active timed challenges for a user,
// filtered by type (daily / weekly / monthly / all).
// Returns current progress and expiry info.
// ============================================================
const getUserTimedChallenges = async (userId, challengeType = null) => {
    const typeFilter = challengeType
        ? `AND gc.challenge_type = '${challengeType}'`
        : `AND gc.challenge_type IN ('daily','weekly','monthly')`;

    const res = await db.query(
        `SELECT gc.challenge_code,
                gc.title,
                gc.description,
                gc.challenge_type,
                gc.target_count,
                gc.reward_points,
                guc.current_progress,
                guc.status,
                guc.period_start,
                guc.expiry_date,
                guc.completed_date,
                ROUND(
                    (guc.current_progress::numeric / NULLIF(gc.target_count, 0)) * 100
                ) AS progress_pct
         FROM gamification_user_challenges guc
         JOIN gamification_challenges gc ON gc.id = guc.challenge_id
         WHERE guc.user_id = $1
           ${typeFilter}
           AND guc.status != 'expired'
         ORDER BY gc.challenge_type, guc.expiry_date`,
        [userId]
    );

    const challenges = res.rows;

    // Group by type for convenience
    const grouped = {
        daily:   challenges.filter(c => c.challenge_type === "daily"),
        weekly:  challenges.filter(c => c.challenge_type === "weekly"),
        monthly: challenges.filter(c => c.challenge_type === "monthly")
    };

    return { challenges, grouped };
};

// ============================================================
// ✅ WBS 2.4.4 — Expire stale user challenges (run by cron).
// Marks any 'active' rows whose expiry_date has passed as
// 'expired'. This keeps the DB state clean.
// ============================================================
const expireStaleUserChallenges = async () => {
    const result = await db.query(
        `UPDATE gamification_user_challenges
         SET status       = 'expired',
             last_updated = NOW()
         WHERE status    = 'active'
           AND expiry_date < CURRENT_DATE
         RETURNING id, user_id, challenge_id`
    );
    console.log(`[Challenge Expiry] Expired ${result.rowCount} stale user challenges.`);
    return result.rowCount;
};

// ============================================================
// ✅ WBS 2.4.1 — Summary stats for a user's timed challenges
// ============================================================
const getChallengeStats = async (userId) => {
    const res = await db.query(
        `SELECT gc.challenge_type,
                COUNT(*)                                  AS total,
                COUNT(*) FILTER (WHERE guc.status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE guc.status = 'active')    AS active,
                COUNT(*) FILTER (WHERE guc.status = 'expired')   AS expired
         FROM gamification_user_challenges guc
         JOIN gamification_challenges gc ON gc.id = guc.challenge_id
         WHERE guc.user_id = $1
           AND gc.challenge_type IN ('daily','weekly','monthly')
         GROUP BY gc.challenge_type`,
        [userId]
    );

    return res.rows;
};

module.exports = {
    assignChallenge,
    assignAllChallengesForPeriod,
    recordChallengeProgress,
    getUserTimedChallenges,
    expireStaleUserChallenges,
    getChallengeStats,
    getPeriodStart,   // exported for testing
    getExpiryDate     // exported for testing
};