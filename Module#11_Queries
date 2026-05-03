-- =====================================================================
-- Module 11 — Freelancer Engagement & Gamification
-- Seed / Population SQL
-- Run this AFTER the main schema (SPM_Centralized_Db.sql) has been run
-- =====================================================================


-- =====================================================================
-- STEP 0: Constraints
-- =====================================================================

ALTER TABLE gamification_user_progress
ADD CONSTRAINT valid_level_range
CHECK (current_level >= 1 AND current_level <= 3);


-- =====================================================================
-- STEP 1: Level Definitions
-- =====================================================================

INSERT INTO gamification_level_definitions (level_number, min_points, max_points, title)
VALUES
    (1, 0,     500,   'Beginner'),
    (2, 501,   15000, 'Intermediate'),
    (3, 15001, NULL,  'Advanced')
ON CONFLICT (level_number) DO UPDATE
    SET min_points = EXCLUDED.min_points,
        max_points = EXCLUDED.max_points,
        title      = EXCLUDED.title;


-- =====================================================================
-- STEP 2: Badge Definitions
-- =====================================================================

INSERT INTO gamification_badges (badge_code, name, description, category, points_awarded)
VALUES
    ('FIRST_PROJECT',        'First Project',        'Awarded when a freelancer completes their very first project.',                   'milestone',   100),
    ('RISING_STAR',          'Rising Star',           'Awarded when a user accumulates 1000 or more total points.',                     'points',      150),
    ('CONSISTENT_PERFORMER', 'Consistent Performer',  'Awarded after logging 10 or more activities on the platform.',                   'activity',    100),
    ('TOP_RATED',            'Top Rated',             'Awarded when a freelancer maintains an average rating of 4.5 or above.',         'reputation',  200),
    ('CHALLENGE_MASTER',     'Challenge Master',      'Awarded after completing 3 or more challenges.',                                 'challenges',  200),
    ('ONBOARDING_COMPLETE',  'Welcome Aboard',        'Awarded when a freelancer completes the full onboarding process.',               'milestone',    50)
ON CONFLICT (badge_code) DO NOTHING;


-- =====================================================================
-- STEP 3: Challenge Definitions
-- =====================================================================

-- Onboarding Challenges
INSERT INTO gamification_challenges
    (challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required)
VALUES
    ('ONBOARD_01', 'Complete your profile',              'Fill out all required profile fields including bio and skills.',      1, 50,  30, 'onboarding', 'profile_complete'),
    ('ONBOARD_02', 'Upload a portfolio project',         'Add at least one project to your portfolio.',                        1, 75,  30, 'onboarding', 'portfolio_upload'),
    ('ONBOARD_03', 'Add your first skill',               'Add at least one skill to your profile.',                            1, 50,  30, 'onboarding', 'skill_added'),
    ('ONBOARD_04', 'Submit your first bid or proposal',  'Place a bid on an open job listing.',                                1, 100, 30, 'onboarding', 'bid_submitted'),
    ('ONBOARD_05', 'Complete identity verification',     'Submit your identity documents for verification.',                   1, 150, 30, 'onboarding', 'identity_verified')
ON CONFLICT (challenge_code) DO NOTHING;

-- Daily Challenges
INSERT INTO gamification_challenges
    (challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required)
VALUES
    ('DAILY_01', 'Log in today',             'Simply log into the platform to stay active and earn daily points.',        1, 10,  1, 'daily', 'login'),
    ('DAILY_02', 'Submit a bid',             'Place at least one bid on any open project today.',                         1, 15,  1, 'daily', 'bid_submitted'),
    ('DAILY_03', 'Send a message',           'Send at least one message to a client or team member.',                     1, 10,  1, 'daily', 'message_sent'),
    ('DAILY_04', 'Update your availability', 'Mark yourself as available for new projects today.',                        1, 10,  1, 'daily', 'availability_updated'),
    ('DAILY_05', 'Leave a review',           'Rate and review a client you recently worked with.',                        1, 20,  1, 'daily', 'review_submitted')
ON CONFLICT (challenge_code) DO NOTHING;

-- Weekly Challenges
INSERT INTO gamification_challenges
    (challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required)
VALUES
    ('WEEKLY_01', 'Submit 5 bids this week',       'Place bids on 5 different projects within the current week.',              5, 75,  7, 'weekly', 'bid_submitted'),
    ('WEEKLY_02', 'Complete a project milestone',  'Deliver at least one project milestone this week.',                        1, 100, 7, 'weekly', 'milestone_completed'),
    ('WEEKLY_03', 'Log in 5 days this week',       'Visit the platform on at least 5 separate days this week.',               5, 50,  7, 'weekly', 'login'),
    ('WEEKLY_04', 'Update your portfolio',         'Add or update at least one portfolio item this week.',                     1, 60,  7, 'weekly', 'portfolio_upload'),
    ('WEEKLY_05', 'Earn a 5-star rating',          'Receive a 5-star rating from a client within this week.',                 1, 100, 7, 'weekly', 'five_star_rating')
ON CONFLICT (challenge_code) DO NOTHING;

-- Monthly Challenges
INSERT INTO gamification_challenges
    (challenge_code, title, description, target_count, reward_points, expiry_days, challenge_type, action_required)
VALUES
    ('MONTHLY_01', 'Complete 3 projects this month',           'Successfully deliver 3 projects within the current calendar month.',         3,   300, 30, 'monthly', 'project_completed'),
    ('MONTHLY_02', 'Earn 500 points this month',               'Accumulate at least 500 points through any combination of actions.',         500, 200, 30, 'monthly', 'points_earned'),
    ('MONTHLY_03', 'Submit 20 bids this month',                'Place bids on 20 different projects within the month.',                      20,  250, 30, 'monthly', 'bid_submitted'),
    ('MONTHLY_04', 'Maintain a 4.5+ rating all month',         'Keep your average client rating at 4.5 or above for the entire month.',      1,   350, 30, 'monthly', 'rating_maintained'),
    ('MONTHLY_05', 'Complete all daily challenges in a week',  'Finish every daily challenge for 7 consecutive days within the month.',      7,   400, 30, 'monthly', 'daily_streak')
ON CONFLICT (challenge_code) DO NOTHING;


-- =====================================================================
-- STEP 4: Test Users
-- =====================================================================

INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES
    ('Raza',   'Khan',   'raza@test.com',   'dummy_hash_1', 'freelancer'),
    ('Ali',    'Hassan', 'ali@test.com',    'dummy_hash_2', 'freelancer'),
    ('Sana',   'Mir',    'sana@test.com',   'dummy_hash_3', 'freelancer'),
    ('Hamza',  'Tariq',  'hamza@test.com',  'dummy_hash_4', 'freelancer'),
    ('Fatima', 'Zahra',  'fatima@test.com', 'dummy_hash_5', 'freelancer'),
    ('Fatima', 'Zahra2', 'fatima2@test.com','dummy_hash_6', 'freelancer')
ON CONFLICT DO NOTHING;


-- =====================================================================
-- STEP 5: Gamification Progress for Test Users
-- =====================================================================

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 3200, 3, 91, 4.90, 0.99 FROM users WHERE email = 'raza@test.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 1850, 2, 42, 4.80, 0.95 FROM users WHERE email = 'ali@test.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 1850, 2, 38, 4.50, 0.88 FROM users WHERE email = 'sana@test.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 1100, 2, 25, 4.20, 0.80 FROM users WHERE email = 'hamza@test.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 720, 1, 17, 3.80, 0.72 FROM users WHERE email = 'fatima@test.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gamification_user_progress
    (user_id, total_points, current_level, activity_count, avg_rating, completion_rate)
SELECT id, 300, 1, 8, 3.50, 0.60 FROM users WHERE email = 'fatima2@test.com'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- STEP 6: Populate Weekly Points Log (for leaderboard weekly filter)
-- =====================================================================

INSERT INTO gamification_weekly_points_log (user_id, week_start, points_earned, activity_count)
SELECT
    user_id,
    DATE_TRUNC('week', NOW())::DATE,
    total_points,
    activity_count
FROM gamification_user_progress
ON CONFLICT (user_id, week_start)
DO UPDATE SET
    points_earned  = EXCLUDED.points_earned,
    activity_count = EXCLUDED.activity_count,
    updated_at     = NOW();


-- =====================================================================
-- STEP 7: Award Badges to Test Users
-- (Tests badge display on leaderboard and profile APIs)
-- =====================================================================

-- Raza Khan — top user, gets all badges
INSERT INTO gamification_user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM users u, gamification_badges b
WHERE u.email = 'raza@test.com'
  AND b.badge_code IN ('FIRST_PROJECT','RISING_STAR','CONSISTENT_PERFORMER','TOP_RATED','CHALLENGE_MASTER')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Ali Hassan — 3 badges
INSERT INTO gamification_user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM users u, gamification_badges b
WHERE u.email = 'ali@test.com'
  AND b.badge_code IN ('FIRST_PROJECT','RISING_STAR','CONSISTENT_PERFORMER')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Sana Mir — 2 badges
INSERT INTO gamification_user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM users u, gamification_badges b
WHERE u.email = 'sana@test.com'
  AND b.badge_code IN ('FIRST_PROJECT','RISING_STAR')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Hamza Tariq — 1 badge
INSERT INTO gamification_user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM users u, gamification_badges b
WHERE u.email = 'hamza@test.com'
  AND b.badge_code IN ('FIRST_PROJECT')
ON CONFLICT (user_id, badge_id) DO NOTHING;


-- =====================================================================
-- STEP 8: Sample Notifications
-- =====================================================================

INSERT INTO gamification_notifications (user_id, notification_type, title, message)
SELECT u.id, 'points', 'Points Earned', 'You earned 50 points for completing a project!'
FROM users u WHERE u.email = 'raza@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gamification_notifications (user_id, notification_type, title, message)
SELECT u.id, 'badge', 'Badge Unlocked', 'Congratulations! You earned the Rising Star badge!'
FROM users u WHERE u.email = 'raza@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gamification_notifications (user_id, notification_type, title, message)
SELECT u.id, 'level_up', 'Level Up!', 'You are now Level 3 — Advanced!'
FROM users u WHERE u.email = 'raza@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gamification_notifications (user_id, notification_type, title, message)
SELECT u.id, 'challenge', 'Challenge Complete', 'You completed the Weekly bid challenge and earned 75 points!'
FROM users u WHERE u.email = 'ali@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gamification_notifications (user_id, notification_type, title, message)
SELECT u.id, 'points', 'Points Earned', 'You earned 100 points for a 5-star client rating!'
FROM users u WHERE u.email = 'sana@test.com'
ON CONFLICT DO NOTHING;


-- =====================================================================
-- STEP 9: Sample Points Ledger Entries
-- (Tests awardPoints API and audit trail)
-- =====================================================================

INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
SELECT u.id, 'login',             10,  'Daily login bonus'           FROM users u WHERE u.email = 'raza@test.com';
INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
SELECT u.id, 'bid_submitted',     15,  'Submitted a project bid'     FROM users u WHERE u.email = 'raza@test.com';
INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
SELECT u.id, 'project_completed', 100, 'Completed a project'         FROM users u WHERE u.email = 'raza@test.com';
INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
SELECT u.id, 'login',             10,  'Daily login bonus'           FROM users u WHERE u.email = 'ali@test.com';
INSERT INTO gamification_points_ledger (user_id, action_type, points, description)
SELECT u.id, 'bid_submitted',     15,  'Submitted a project bid'     FROM users u WHERE u.email = 'sana@test.com';


-- =====================================================================
-- STEP 10: Assign Active Challenges to Users
-- (Tests challenge progress tracking)
-- =====================================================================

-- Assign DAILY_01 (login) to Raza — in progress
INSERT INTO gamification_user_challenges (user_id, challenge_id, current_progress, status)
SELECT u.id, c.id, 0, 'active'
FROM users u, gamification_challenges c
WHERE u.email = 'raza@test.com' AND c.challenge_code = 'DAILY_01'
ON CONFLICT DO NOTHING;

-- Assign WEEKLY_01 (5 bids) to Ali — partially completed (3/5)
INSERT INTO gamification_user_challenges (user_id, challenge_id, current_progress, status)
SELECT u.id, c.id, 3, 'active'
FROM users u, gamification_challenges c
WHERE u.email = 'ali@test.com' AND c.challenge_code = 'WEEKLY_01'
ON CONFLICT DO NOTHING;

-- Assign ONBOARD_01 to Fatima — completed
INSERT INTO gamification_user_challenges (user_id, challenge_id, current_progress, status, completed_date)
SELECT u.id, c.id, 1, 'completed', NOW()
FROM users u, gamification_challenges c
WHERE u.email = 'fatima@test.com' AND c.challenge_code = 'ONBOARD_01'
ON CONFLICT DO NOTHING;


-- =====================================================================
-- STEP 11: Trust Scores
-- (Tests GET /api/user/:id/trust-score)
-- =====================================================================

UPDATE gamification_user_progress
SET trust_score = ROUND(
    (COALESCE(avg_rating, 0) / 5.0 * 40) +
    (LEAST(COALESCE(activity_count, 0), 100) / 100.0 * 30) +
    (COALESCE(completion_rate, 0) * 30)
, 2);


-- =====================================================================
-- VERIFICATION QUERIES — run to confirm everything is seeded correctly
-- =====================================================================

-- Check level definitions
SELECT * FROM gamification_level_definitions ORDER BY level_number;

-- Check badge definitions
SELECT badge_code, name, category, points_awarded FROM gamification_badges ORDER BY badge_code;

-- Check challenge definitions
SELECT challenge_code, challenge_type, target_count, reward_points FROM gamification_challenges ORDER BY challenge_type, challenge_code;

-- Check users and their progress
SELECT
    u.first_name || ' ' || u.last_name AS name,
    u.email,
    gup.total_points,
    gup.current_level,
    gup.activity_count,
    gup.avg_rating,
    gup.trust_score,
    COUNT(gub.badge_id) AS badge_count
FROM users u
LEFT JOIN gamification_user_progress gup ON gup.user_id = u.id
LEFT JOIN gamification_user_badges gub ON gub.user_id = u.id
WHERE u.email LIKE '%test.com%'
GROUP BY u.first_name, u.last_name, u.email, gup.total_points, gup.current_level, gup.activity_count, gup.avg_rating, gup.trust_score
ORDER BY gup.total_points DESC;

-- Check weekly points log
SELECT * FROM gamification_weekly_points_log ORDER BY points_earned DESC;

-- Check notifications
SELECT user_id, notification_type, title FROM gamification_notifications ORDER BY created_at DESC LIMIT 10;

-- Check challenge assignments
SELECT
    u.first_name || ' ' || u.last_name AS name,
    gc.challenge_code,
    gc.challenge_type,
    guc.current_progress,
    gc.target_count,
    guc.status
FROM gamification_user_challenges guc
JOIN users u ON u.id = guc.user_id
JOIN gamification_challenges gc ON gc.id = guc.challenge_id
ORDER BY u.first_name;