// =============================================================
// src/services/notificationService.js
// WBS 3.3 — Notification Service
// =============================================================
// CHANGES FROM DUMMY VERSION:
//   - All [DB SWAP] comments are now active real queries
//   - Table name: notifications → gamification_notifications
//   - Schema differences in centralized DB:
//       notification_id (VARCHAR PK) → id (SERIAL) + uuid (UUID)
//       type (VARCHAR)               → notification_type (VARCHAR)
//       no title column before      → title (VARCHAR 100) required
//   - user_id is now INTEGER — matches users.id
//   - persistNotification() uses uuid for notification_id in response
//   - getNotifications() maps centralized columns to response shape
//   - dummy data blocks removed entirely
// =============================================================

require("dotenv").config();
const pool = require("../db/pool");
const { v4: uuidv4 } = require("uuid");

// -------------------------------------------------------
// 3.3.1 — Allowed event types and message templates (unchanged)
// -------------------------------------------------------
const VALID_TYPES = ["points", "level", "badge", "challenge"];

const DEFAULT_MESSAGES = {
  points:    (data) => `You earned ${data.points ?? "some"} points!`,
  level:     (data) => `Level Up! You are now Level ${data.level ?? "?"}.`,
  badge:     (data) => `Congratulations! You earned the "${data.badge_name ?? "new"}" badge!`,
  challenge: (data) => `Challenge update: ${data.challenge_name ?? "A challenge"} is ready!`,
};

// CHANGED: title is now a required column in gamification_notifications
const DEFAULT_TITLES = {
  points:    "Points Earned",
  level:     "Level Up!",
  badge:     "Badge Unlocked",
  challenge: "Challenge Update",
};

// -------------------------------------------------------
// 3.3.2 — Internal Notification Queue & Dispatcher (unchanged)
// -------------------------------------------------------
const notificationQueue = [];
let isProcessing = false;

function enqueueNotification(userId, type, message, data = {}) {
  if (!VALID_TYPES.includes(type)) {
    console.warn(`[Notifications] Invalid type "${type}" — skipped.`);
    return;
  }

  const resolvedMessage = message || DEFAULT_MESSAGES[type](data);
  notificationQueue.push({ userId, type, message: resolvedMessage });
  console.log(`[Notifications] Queued: [${type}] for user ${userId}`);

  if (!isProcessing) drainQueue();
}

async function drainQueue() {
  isProcessing = true;
  while (notificationQueue.length > 0) {
    const job = notificationQueue.shift();
    try {
      await persistNotification(job.userId, job.type, job.message);
    } catch (err) {
      console.error(`[Notifications] Failed to persist:`, err.message);
    }
  }
  isProcessing = false;
}

// CHANGED: inserts into gamification_notifications
//          includes required `title` column
//          uses notification_type instead of type
async function persistNotification(userId, type, message) {
  const title = DEFAULT_TITLES[type] || "Notification";

  const { rows } = await pool.query(
    `INSERT INTO gamification_notifications
       (user_id, notification_type, title, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, uuid, user_id, notification_type, title, message, is_read, created_at`,
    [userId, type, title, message]
  );

  return rows[0];
}

// -------------------------------------------------------
// 3.3.3 — Notification Read / Archive APIs
// -------------------------------------------------------

// CHANGED: queries gamification_notifications
//          maps notification_type → type and id/uuid → notification_id in response
async function getNotifications(userId, options = {}) {
  const { unreadOnly = false, limit = 20 } = options;

  const whereClause = unreadOnly
    ? `WHERE user_id = $1 AND is_read = FALSE`
    : `WHERE user_id = $1`;

  const { rows } = await pool.query(
    `SELECT id, uuid, user_id, notification_type AS type,
            title, message, is_read, created_at
     FROM gamification_notifications
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM gamification_notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );

  // CHANGED: map id to notification_id for frontend compatibility
  const notifications = rows.map(n => ({
    notification_id: n.uuid || String(n.id),
    user_id:         n.user_id,
    type:            n.type,
    title:           n.title,
    message:         n.message,
    is_read:         n.is_read,
    created_at:      n.created_at,
  }));

  return {
    user_id:      userId,
    unread_count: parseInt(countRows[0].count),
    count:        notifications.length,
    notifications,
  };
}

// CHANGED: updates gamification_notifications using uuid as the public identifier
async function markAsRead(userId, notificationId) {
  const { rows } = await pool.query(
    `UPDATE gamification_notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE uuid::TEXT = $1 AND user_id = $2
     RETURNING id, uuid, user_id, notification_type AS type,
               title, message, is_read, created_at`,
    [notificationId, userId]
  );

  if (!rows.length) throw new Error(`Notification "${notificationId}" not found for user "${userId}".`);

  const n = rows[0];
  return {
    notification_id: n.uuid || String(n.id),
    user_id:         n.user_id,
    type:            n.type,
    title:           n.title,
    message:         n.message,
    is_read:         n.is_read,
    created_at:      n.created_at,
  };
}

// CHANGED: updates gamification_notifications, sets read_at
async function markAllAsRead(userId) {
  const { rowCount } = await pool.query(
    `UPDATE gamification_notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return { user_id: userId, marked_read: rowCount };
}

// CHANGED: queries gamification_notifications
async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM gamification_notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return { user_id: userId, unread_count: parseInt(rows[0].count) };
}

module.exports = {
  enqueueNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};