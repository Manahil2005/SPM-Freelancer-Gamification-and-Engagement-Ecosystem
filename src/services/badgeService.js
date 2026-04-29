// ============================================================
// services/badgeService.js
// Module 11 — Badge Seeder & Admin Config
// ✅ WBS 2.2.1 — Badge Trigger Conditions (definitions)
// ✅ WBS 2.5.3 — Badge Rules Configuration API (service layer)
// ✅ WBS 2.4   — Time-Based Challenge Definitions (NEW)
//               Daily / Weekly / Monthly challenge seeding
// ============================================================

const db = require("../db/pool");

// ============================================================
// ✅ WBS 2.2.1 — All 5 required badges with their definitions
// ============================================================
const BADGE_DEFINITIONS = [
    {
        badge_code:     "FIRST_PROJECT",
        name:           "First Project",
        description:    "Awarded when a freelancer completes their very first project.",
        category:       "milestone",
        points_awarded: 100
    },
    {
        badge_code:     "RISING_STAR",
        name:           "Rising Star",
        description:    "Awarded when a user accumulates 1000 or more total points.",
        category:       "points",
        points_awarded: 150
    },
    {
        badge_code:     "CONSISTENT_PERFORMER",
        name:           "Consistent Performer",
        description:    "Awarded after logging 10 or more activities on the platform.",
        category:       "activity",
        points_awarded: 100
    },
    {
        badge_code:     "TOP_RATED",
        name:           "Top Rated",
        description:    "Awarded when a freelancer maintains an average rating of 4.5 or above.",
        category:       "reputation",
        points_awarded: 200
    },
    {
        badge_code:     "CHALLENGE_MASTER",
        name:           "Challenge Master",
        description:    "Awarded after completing 3 or more challenges.",
        category:       "challenges",
        points_awarded: 200
    }
];

// ============================================================
// Onboarding challenge definitions
// ✅ WBS 4.2 — Gamified Onboarding
// ============================================================
const ONBOARDING_CHALLENGE_DEFINITIONS = [
    {
        challenge_code:  "ONBOARD_01",
        title:           "Complete your profile",
        description:     "Fill out all required profile fields including bio and skills.",
        target_count:    1,
        reward_points:   50,
        expiry_days:     30,
        challenge_type:  "onboarding",
        action_required: "profile_complete"
    },
    {
        challenge_code:  "ONBOARD_02",
        title:           "Upload a portfolio project",
        description:     "Add at least one project to your portfolio.",
        target_count:    1,
        reward_points:   75,
        expiry_days:     30,
        challenge_type:  "onboarding",
        action_required: "portfolio_upload"
    },
    {
        challenge_code:  "ONBOARD_03",
        title:           "Add your first skill",
        description:     "Add at least one skill to your profile.",
        target_count:    1,
        reward_points:   50,
        expiry_days:     30,
        challenge_type:  "onboarding",
        action_required: "skill_added"
    },
    {
        challenge_code:  "ONBOARD_04",
        title:           "Submit your first bid or proposal",
        description:     "Place a bid on an open job listing.",
        target_count:    1,
        reward_points:   100,
        expiry_days:     30,
        challenge_type:  "onboarding",
        action_required: "bid_submitted"
    },
    {
        challenge_code:  "ONBOARD_05",
        title:           "Complete identity verification",
        description:     "Submit your identity documents for verification.",
        target_count:    1,
        reward_points:   150,
        expiry_days:     30,
        challenge_type:  "onboarding",
        action_required: "identity_verified"
    }
];

// ============================================================
// ✅ WBS 2.4 — Time-Based Challenge Definitions (NEW)
//
// challenge_type: "daily" | "weekly" | "monthly"
// expiry_days:    1 = daily, 7 = weekly, 30 = monthly
//
// Daily   — lightweight, habit-forming actions (1-day window)
// Weekly  — moderate effort, consistent engagement (7-day window)
// Monthly — high-effort, milestone-level goals (30-day window)
//
// NOTE: Each challenge is re-assignable. The service layer
// (see challengeService.js) creates a fresh gamification_user_challenges
// row per period so users can earn these repeatedly.
// ============================================================

const DAILY_CHALLENGE_DEFINITIONS = [
    {
        challenge_code:  "DAILY_01",
        title:           "Log in today",
        description:     "Simply log into the platform to stay active and earn daily points.",
        target_count:    1,
        reward_points:   10,
        expiry_days:     1,
        challenge_type:  "daily",
        action_required: "login"
    },
    {
        challenge_code:  "DAILY_02",
        title:           "Submit a bid",
        description:     "Place at least one bid on any open project today.",
        target_count:    1,
        reward_points:   15,
        expiry_days:     1,
        challenge_type:  "daily",
        action_required: "bid_submitted"
    },
    {
        challenge_code:  "DAILY_03",
        title:           "Send a message",
        description:     "Send at least one message to a client or team member.",
        target_count:    1,
        reward_points:   10,
        expiry_days:     1,
        challenge_type:  "daily",
        action_required: "message_sent"
    },
    {
        challenge_code:  "DAILY_04",
        title:           "Update your availability",
        description:     "Mark yourself as available for new projects today.",
        target_count:    1,
        reward_points:   10,
        expiry_days:     1,
        challenge_type:  "daily",
        action_required: "availability_updated"
    },
    {
        challenge_code:  "DAILY_05",
        title:           "Leave a review",
        description:     "Rate and review a client you recently worked with.",
        target_count:    1,
        reward_points:   20,
        expiry_days:     1,
        challenge_type:  "daily",
        action_required: "review_submitted"
    }
];

const WEEKLY_CHALLENGE_DEFINITIONS = [
    {
        challenge_code:  "WEEKLY_01",
        title:           "Submit 5 bids this week",
        description:     "Place bids on 5 different projects within the current week.",
        target_count:    5,
        reward_points:   75,
        expiry_days:     7,
        challenge_type:  "weekly",
        action_required: "bid_submitted"
    },
    {
        challenge_code:  "WEEKLY_02",
        title:           "Complete a project milestone",
        description:     "Deliver at least one project milestone this week.",
        target_count:    1,
        reward_points:   100,
        expiry_days:     7,
        challenge_type:  "weekly",
        action_required: "milestone_completed"
    },
    {
        challenge_code:  "WEEKLY_03",
        title:           "Log in 5 days this week",
        description:     "Visit the platform on at least 5 separate days this week.",
        target_count:    5,
        reward_points:   50,
        expiry_days:     7,
        challenge_type:  "weekly",
        action_required: "login"
    },
    {
        challenge_code:  "WEEKLY_04",
        title:           "Update your portfolio",
        description:     "Add or update at least one portfolio item this week.",
        target_count:    1,
        reward_points:   60,
        expiry_days:     7,
        challenge_type:  "weekly",
        action_required: "portfolio_upload"
    },
    {
        challenge_code:  "WEEKLY_05",
        title:           "Earn a 5-star rating",
        description:     "Receive a 5-star rating from a client within this week.",
        target_count:    1,
        reward_points:   100,
        expiry_days:     7,
        challenge_type:  "weekly",
        action_required: "five_star_rating"
    }
];

const MONTHLY_CHALLENGE_DEFINITIONS = [
    {
        challenge_code:  "MONTHLY_01",
        title:           "Complete 3 projects this month",
        description:     "Successfully deliver 3 projects within the current calendar month.",
        target_count:    3,
        reward_points:   300,
        expiry_days:     30,
        challenge_type:  "monthly",
        action_required: "project_completed"
    },
    {
        challenge_code:  "MONTHLY_02",
        title:           "Earn 500 points this month",
        description:     "Accumulate at least 500 points through any combination of actions.",
        target_count:    500,
        reward_points:   200,
        expiry_days:     30,
        challenge_type:  "monthly",
        action_required: "points_earned"
    },
    {
        challenge_code:  "MONTHLY_03",
        title:           "Submit 20 bids this month",
        description:     "Place bids on 20 different projects within the month.",
        target_count:    20,
        reward_points:   250,
        expiry_days:     30,
        challenge_type:  "monthly",
        action_required: "bid_submitted"
    },
    {
        challenge_code:  "MONTHLY_04",
        title:           "Maintain a 4.5+ rating all month",
        description:     "Keep your average client rating at 4.5 or above for the entire month.",
        target_count:    1,
        reward_points:   350,
        expiry_days:     30,
        challenge_type:  "monthly",
        action_required: "rating_maintained"
    },
    {
        challenge_code:  "MONTHLY_05",
        title:           "Complete all daily challenges in a week",
        description:     "Finish every daily challenge for 7 consecutive days within the month.",
        target_count:    7,
        reward_points:   400,
        expiry_days:     30,
        challenge_type:  "monthly",
        action_required: "daily_streak"
    }
];

// ============================================================
// Seed helpers — all use ON CONFLICT DO NOTHING (idempotent)
// ============================================================

/**
 * Seeds badge definitions into gamification_badges.
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
 * Seeds onboarding challenges into gamification_challenges.
 * ✅ WBS 4.2 / WBS 2.4.1
 */
const seedOnboardingChallenges = async () => {
    for (const ch of ONBOARDING_CHALLENGE_DEFINITIONS) {
        await db.query(
            `INSERT INTO gamification_challenges
                 (challenge_code, title, description, target_count,
                  reward_points, expiry_days, challenge_type, action_required)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (challenge_code) DO NOTHING`,
            [
                ch.challenge_code, ch.title, ch.description, ch.target_count,
                ch.reward_points,  ch.expiry_days, ch.challenge_type, ch.action_required
            ]
        );
    }
    console.log("[Challenge Seeder] All 5 onboarding challenges seeded.");
};

/**
 * Seeds all time-based (daily/weekly/monthly) challenges.
 * ✅ WBS 2.4 — Time-Based Challenges
 */
const seedTimedChallenges = async () => {
    const allTimed = [
        ...DAILY_CHALLENGE_DEFINITIONS,
        ...WEEKLY_CHALLENGE_DEFINITIONS,
        ...MONTHLY_CHALLENGE_DEFINITIONS
    ];

    for (const ch of allTimed) {
        await db.query(
            `INSERT INTO gamification_challenges
                 (challenge_code, title, description, target_count,
                  reward_points, expiry_days, challenge_type, action_required)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (challenge_code) DO NOTHING`,
            [
                ch.challenge_code, ch.title, ch.description, ch.target_count,
                ch.reward_points,  ch.expiry_days, ch.challenge_type, ch.action_required
            ]
        );
    }
    console.log(`[Challenge Seeder] ${allTimed.length} timed challenges seeded (daily/weekly/monthly).`);
};

/**
 * ✅ WBS 2.5.3 — Badge Rules Configuration: Update badge points/description
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

module.exports = {
    seedBadges,
    seedOnboardingChallenges,
    seedTimedChallenges,
    updateBadgeConfig,
    BADGE_DEFINITIONS,
    DAILY_CHALLENGE_DEFINITIONS,
    WEEKLY_CHALLENGE_DEFINITIONS,
    MONTHLY_CHALLENGE_DEFINITIONS
};