-- =============================================================
-- MODULE 11 — PostgreSQL Schema
-- Covers WBS 3.1 (Leaderboard), 3.2 (Trust Score), 3.3 (Notifications)
-- =============================================================
-- HOW TO USE:
--   1. Create your DB:  createdb gamification_db
--   2. Run this file:   psql -U postgres -d gamification_db -f schema.sql
-- =============================================================

-- -------------------------------------------------------
-- UserProgress (central user gamification state)
-- Shared by WBS 2.x and 3.x — defined here for reference
-- WBS 2.1.1, 2.3.1, 3.1, 3.2
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
    user_id         VARCHAR(50)   PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    total_points    INTEGER       NOT NULL DEFAULT 0,
    level           INTEGER       NOT NULL DEFAULT 1,
    activity_count  INTEGER       NOT NULL DEFAULT 0,  -- for leaderboard tiebreaker
    avg_rating      NUMERIC(3,2)  NOT NULL DEFAULT 0.0, -- from Module 1
    completion_rate NUMERIC(5,4)  NOT NULL DEFAULT 0.0, -- from Module 3
    trust_score     NUMERIC(5,2)  DEFAULT NULL,
                    CHECK (trust_score IS NULL OR (trust_score >= 0 AND trust_score <= 100)),

    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 3.1 — Leaderboard Snapshot Table (for caching)
-- -------------------------------------------------------
-- Stores a pre-computed leaderboard result so GET /api/leaderboard
-- is fast (<3s for 10,000 users, per NFR-3).
-- The cron job (leaderboardService.js) refreshes this periodically.
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id              SERIAL        PRIMARY KEY,
    period          VARCHAR(10)   NOT NULL CHECK (period IN ('weekly', 'all')),
    user_id         VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    rank            INTEGER       NOT NULL,
    points_for_rank INTEGER       NOT NULL, -- weekly pts for 'weekly', total pts for 'all'
    total_points    INTEGER       NOT NULL, -- always all-time total (for display)
    activity_count  INTEGER       NOT NULL,
    week_start      DATE          DEFAULT NULL, -- set only when period='weekly'
    snapshot_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_cache(period, rank);

- -------------------------------------------------------
-- 3.1a — Weekly Points Log
-- -------------------------------------------------------
-- Tracks how many points each user earns in each ISO week.
-- Used to rank the WEEKLY leaderboard on points earned THIS
-- week only — not total_points (which is all-time).
--
-- week_start: Monday 00:00 UTC of the ISO week (DATE_TRUNC('week', NOW()))
-- points_earned: cumulative points added in that week for that user
-- activity_count: actions performed in that week (weekly tiebreaker)
--
-- When a user earns points:
--   INSERT INTO weekly_points_log (user_id, week_start, points_earned, activity_count)
--   VALUES ($1, DATE_TRUNC('week', NOW()), $2, 1)
--   ON CONFLICT (user_id, week_start)
--   DO UPDATE SET
--     points_earned  = weekly_points_log.points_earned  + EXCLUDED.points_earned,
--     activity_count = weekly_points_log.activity_count + EXCLUDED.activity_count,
--     updated_at     = NOW();
CREATE TABLE IF NOT EXISTS weekly_points_log (
    id              SERIAL        PRIMARY KEY,
    user_id         VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    week_start      DATE          NOT NULL, -- Monday of the ISO week
    points_earned   INTEGER       NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    activity_count  INTEGER       NOT NULL DEFAULT 0 CHECK (activity_count >= 0),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start)             -- one row per user per week
);
 
CREATE INDEX IF NOT EXISTS idx_weekly_points_week  ON weekly_points_log(week_start, points_earned DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_points_user  ON weekly_points_log(user_id, week_start DESC);



-- -------------------------------------------------------
-- 3.2 — Trust Score History
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS trust_score_history (
    id              SERIAL        PRIMARY KEY,
    user_id         VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    trust_score     NUMERIC(5,2)  NOT NULL,
    avg_rating      NUMERIC(3,2)  NOT NULL,
    completion_rate NUMERIC(5,4)  NOT NULL,
    calculated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_history_user ON trust_score_history(user_id, calculated_at DESC);

-- -------------------------------------------------------
-- 3.3 — Notifications
-- -------------------------------------------------------
-- type must be one of 4 event types defined in SRS 4.8
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(20)   PRIMARY KEY,
    user_id         VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    type            VARCHAR(20)   NOT NULL CHECK (type IN ('points', 'level', 'badge', 'challenge')),
    message         TEXT          NOT NULL,
    is_read         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- -------------------------------------------------------
-- 2. Points Ledger (Audit Trail) - WBS 2.1.1, 2.5.4
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id   SERIAL PRIMARY KEY,
    user_id     VARCHAR(50) NOT NULL REFERENCES user_progress(user_id),
    action_type VARCHAR(50) NOT NULL,
    points      INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 3. Badges System - WBS 2.2.1, 2.2.3
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
    badge_id    VARCHAR(20)   PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    description TEXT,
    icon        VARCHAR(10)   -- Emoji/Icon for UI
);


CREATE TABLE IF NOT EXISTS user_badges (
    user_id     VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    badge_id    VARCHAR(20)   NOT NULL REFERENCES badges(badge_id),
    unlocked_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- -------------------------------------------------------
-- 4. Challenges & Tracking - WBS 2.4.1, 2.4.2
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
    challenge_id   VARCHAR(20)   PRIMARY KEY,
    title          VARCHAR(100)  NOT NULL,
    target_count   INTEGER       NOT NULL,
    reward_points  INTEGER       NOT NULL,
    expiry_days    INTEGER       NOT NULL,
    type           VARCHAR(20)   CHECK (type IN ('Daily', 'Weekly', 'Streak'))
);

CREATE TABLE IF NOT EXISTS user_challenges (
    id               SERIAL        PRIMARY KEY,
    user_id          VARCHAR(50)   NOT NULL REFERENCES user_progress(user_id),
    challenge_id     VARCHAR(20)   NOT NULL REFERENCES challenges(challenge_id),
    current_progress INTEGER       DEFAULT 0,
    status           VARCHAR(20)   DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Expired')),
    start_date       TIMESTAMPTZ   DEFAULT NOW()
);

-- -------------------------------------------------------
-- 8. Security Audit - WBS 5.1.1, 5.1.3
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    log_id      SERIAL        PRIMARY KEY,
    admin_id    VARCHAR(50)   NOT NULL,
    action      TEXT          NOT NULL,
    target_user VARCHAR(50),
    ip_address  VARCHAR(45),
    timestamp   TIMESTAMPTZ   DEFAULT NOW()
);

-- -------------------------------------------------------
-- 5. Onboarding Experience (Persistence) - WBS 4.2
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_onboarding (
    user_id         VARCHAR(50) PRIMARY KEY REFERENCES user_progress(user_id),
    is_fully_completed BOOLEAN DEFAULT FALSE,
    current_step    INTEGER DEFAULT 1,      -- Track which step they are on
    steps_completed JSONB DEFAULT '[]',     -- Store array of completed step IDs: ["profile_pic", "bio_set"]
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- Seed dummy data for local development / testing
-- -------------------------------------------------------
-- -------------------------------------------------------
-- Seed weekly_points_log — current week + two prior weeks
-- DATE_TRUNC('week', NOW()) gives the Monday of this week.
-- -------------------------------------------------------
INSERT INTO weekly_points_log (user_id, week_start, points_earned, activity_count)
VALUES
  -- Current week (week of 2026-04-20)
  ('u001', DATE_TRUNC('week', NOW())::DATE,  320, 8),
  ('u002', DATE_TRUNC('week', NOW())::DATE,  410, 11),
  ('u003', DATE_TRUNC('week', NOW())::DATE,  890, 23),
  ('u004', DATE_TRUNC('week', NOW())::DATE,   75, 3),
  ('u005', DATE_TRUNC('week', NOW())::DATE,  190, 5),
  -- Previous week (week of 2026-04-13)
  ('u001', (DATE_TRUNC('week', NOW()) - INTERVAL '7 days')::DATE, 500, 13),
  ('u002', (DATE_TRUNC('week', NOW()) - INTERVAL '7 days')::DATE, 280, 7),
  ('u003', (DATE_TRUNC('week', NOW()) - INTERVAL '7 days')::DATE, 950, 25),
  ('u005', (DATE_TRUNC('week', NOW()) - INTERVAL '7 days')::DATE, 200, 6),
  -- Two weeks ago (week of 2026-04-06)
  ('u001', (DATE_TRUNC('week', NOW()) - INTERVAL '14 days')::DATE, 400, 10),
  ('u003', (DATE_TRUNC('week', NOW()) - INTERVAL '14 days')::DATE, 700, 18)
ON CONFLICT (user_id, week_start) DO NOTHING;

INSERT INTO user_progress (user_id, name, total_points, level, activity_count, avg_rating, completion_rate, created_at)
VALUES
  ('u001', 'Ali Hassan',   1850, 2, 42, 4.80, 0.9500, '2025-11-01'),
  ('u002', 'Sana Mir',     1850, 2, 38, 4.50, 0.8800, '2025-10-15'),
  ('u003', 'Raza Khan',    3200, 3, 91, 4.90, 0.9900, '2025-09-20'),
  ('u004', 'Fatima Zahra',  720, 1, 17, 3.80, 0.7200, '2026-01-10'),
  ('u005', 'Hamza Tariq',  1100, 2, 25, 4.20, 0.8000, '2025-12-05')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO notifications (notification_id, user_id, type, message, is_read)
VALUES
  ('n001', 'u001', 'points',    'You earned 50 points for completing a project!', FALSE),
  ('n002', 'u001', 'badge',     'Congratulations! You earned the Rising Star badge!', FALSE),
  ('n003', 'u001', 'level',     'Level Up! You are now Level 2 - Intermediate.', TRUE),
  ('n004', 'u002', 'challenge', 'New weekly challenge: Complete 3 projects this week!', FALSE),
  ('n005', 'u003', 'points',    'You earned 100 points for a 5-star client rating!', FALSE)
ON CONFLICT (notification_id) DO NOTHING;

-- Initial Badges
INSERT INTO badges (badge_id, name, description, icon) VALUES
('b_early', 'Early Bird', 'Completed onboarding on day 1', '🌅'),
('b_star', 'Rising Star', 'Reached Level 2', '⭐') ON CONFLICT DO NOTHING;

-- Initial Challenges
INSERT INTO challenges (challenge_id, title, target_count, reward_points, expiry_days, type) VALUES
('ch_weekly', 'Weekly Warrior', 3, 100, 7, 'Weekly') ON CONFLICT DO NOTHING;