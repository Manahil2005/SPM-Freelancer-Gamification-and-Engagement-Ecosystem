// ============================================================
// services/badgeService.js
// Module 11 — Badge Seeder & Admin Config
// ✅ WBS 2.2.1 — Badge Trigger Conditions (definitions)
// ✅ WBS 2.5.3 — Badge Rules Configuration API (service layer)
// ============================================================

const db = require("../db/pool");

// ============================================================
// ✅ WBS 2.2.1 — All 5 required badges with their definitions
// These must be seeded into gamification_badges before the
// badge engine can award them.
// ============================================================
const BADGE_DEFINITIONS = [
    {
        badge_code:    "FIRST_PROJECT",
        name:          "First Project",
        description:   "Awarded when a freelancer completes their very first project.",
        category:      "milestone",
        points_awarded: 100
    },
    {
        badge_code:    "RISING_STAR",
        name:          "Rising Star",
        description:   "Awarded when a user accumulates 1000 or more total points.",
        category:      "points",
        points_awarded: 150
    },
    {
        badge_code:    "CONSISTENT_PERFORMER",
        name:          "Consistent Performer",
        description:   "Awarded after logging 10 or more activities on the platform.",
        category:      "activity",
        points_awarded: 100
    },
    {
        badge_code:    "TOP_RATED",
        name:          "Top Rated",
        description:   "Awarded when a freelancer maintains an average rating of 4.5 or above.",
        category:      "reputation",
        points_awarded: 200
    },
    {
        badge_code:    "CHALLENGE_MASTER",
        name:          "Challenge Master",
        description:   "Awarded after completing 3 or more challenges.",
        category:      "challenges",
        points_awarded: 200
    }
];

/**
 * Seeds badge definitions into gamification_badges.
 * Uses INSERT ... ON CONFLICT (badge_code) DO NOTHING — safe to re-run.
 * ✅ WBS 2.2.1
 */
const seedBadges = async () => {
    for (const badge of BADGE_DEFINITIONS) {
        await db.query(
            `INSERT INTO gamification_badges
                 (badge_code, name, description, category, points_awarded)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (badge_code) DO NOTHING`,
            [badge.badge_code, badge.name, badge.description, badge.category, badge.points_awarded]
        );
    }
    console.log("[Badge Seeder] All 5 badges seeded.");
};


/**
 * ✅ WBS 2.5.3 — Badge Rules Configuration: Update badge points/description
 * PUT /api/gamification/admin/badges/:badgeCode
 */
const updateBadgeConfig = async (badgeCode, updates) => {
    const allowedFields = ["description", "points_awarded", "is_active"];
    const setClauses    = [];
    const values        = [];
    let   paramIndex    = 1;

    for (const [key, val] of Object.entries(updates)) {
        if (!allowedFields.includes(key)) continue;
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(val);
    }

    if (setClauses.length === 0) throw new Error("No valid fields to update");

    values.push(badgeCode);
    const result = await db.query(
        `UPDATE gamification_badges SET ${setClauses.join(", ")}
         WHERE badge_code = $${paramIndex}
         RETURNING *`,
        values
    );

    if (result.rows.length === 0) throw new Error(`Badge ${badgeCode} not found`);
    return result.rows[0];
};

module.exports = { seedBadges, seedOnboardingChallenges, updateBadgeConfig, BADGE_DEFINITIONS };