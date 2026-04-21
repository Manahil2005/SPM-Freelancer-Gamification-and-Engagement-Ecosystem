// =============================================================
// src/services/notificationService.js
// WBS 3.3 — Notification Service
// =============================================================
// Sub-tasks covered:
//   3.3.1 Design Notification Schema & Trigger Events
//   3.3.2 Implement Internal Notification Queue & Dispatcher (4 event types)
//   3.3.3 Implement Notification Read/Archive APIs
//
// 4 Event Types (per SRS REQ-36, WBS 3.3.2):
//   "points"    - user earned points
//   "level"     - user leveled up
//   "badge"     - user earned a badge
//   "challenge" - new challenge or challenge completed
//
// Internal Queue: a simple in-process queue array that is
//   drained asynchronously so notification creation is
//   non-blocking. Replace with Redis / BullMQ in production.
//
// [DB SWAP] markers show exact swap points for real PostgreSQL.
// =============================================================

require("dotenv").config();
const dummy = require("../db/dummyData");
const pool  = require("../db/pool");

const USE_DUMMY = process.env.USE_DUMMY_DB === "true";

// -------------------------------------------------------
// 3.3.1 — Allowed event types and default message templates
// -------------------------------------------------------

const VALID_TYPES = ["points", "level", "badge", "challenge"];

const DEFAULT_MESSAGES = {
  points:    (data) => `You earned ${data.points ?? "some"} points!`,
  level:     (data) => `Level Up! You are now Level ${data.level ?? "?"}.`,
  badge:     (data) => `Congratulations! You earned the "${data.badge_name ?? "new"}" badge!`,
  challenge: (data) => `Challenge update: ${data.challenge_name ?? "A challenge"} is ready!`,
};

// -------------------------------------------------------
// 3.3.2 — Internal Notification Queue & Dispatcher
// -------------------------------------------------------

// Simple in-memory queue. Each item: { userId, type, message, data }
const notificationQueue = [];
let isProcessing = false;

/**
 * Add a notification job to the internal queue.
 * Non-blocking — caller doesn't wait for DB write.
 *
 * @param {string} userId
 * @param {string} type   - one of 4 valid types
 * @param {string} message - human-readable message (optional, auto-generated if omitted)
 * @param {Object} data    - extra metadata for template generation
 */
function enqueueNotification(userId, type, message, data = {}) {
  if (!VALID_TYPES.includes(type)) {
    console.warn(`[Notifications] Invalid type "${type}" — skipped.`);
    return;
  }

  const resolvedMessage = message || DEFAULT_MESSAGES[type](data);

  notificationQueue.push({ userId, type, message: resolvedMessage });
  console.log(`[Notifications] Queued: [${type}] for user ${userId}`);

  // Start draining if not already running
  if (!isProcessing) drainQueue();
}

/**
 * Drain the queue asynchronously, one item at a time.
 * Each item is written to the notification store (dummy or DB).
 */
async function drainQueue() {
  isProcessing = true;

  while (notificationQueue.length > 0) {
    const job = notificationQueue.shift();

    try {
      await persistNotification(job.userId, job.type, job.message);
    } catch (err) {
      console.error(`[Notifications] Failed to persist notification:`, err.message);
      // In production: push to dead-letter queue or retry
    }
  }

  isProcessing = false;
}

/**
 * Write one notification to storage.
 * [DB SWAP] Replace dummy block with real pg INSERT.
 */
async function persistNotification(userId, type, message) {
  const notificationId = dummy.getNextNotificationId();
  const entry = {
    notification_id: notificationId,
    user_id: userId,
    type,
    message,
    is_read: false,
    created_at: new Date(),
  };

  if (USE_DUMMY) {
    dummy.notifications.push(entry);
    return entry;
  }

  // [DB SWAP]:
  // const { rows } = await pool.query(
  //   `INSERT INTO notifications (notification_id, user_id, type, message)
  //    VALUES ($1, $2, $3, $4) RETURNING *`,
  //   [notificationId, userId, type, message]
  // );
  // return rows[0];
}

// -------------------------------------------------------
// 3.3.3 — Notification Read / Archive APIs (service layer)
// -------------------------------------------------------

/**
 * Get all notifications for a user, most recent first.
 * @param {string} userId
 * @param {Object} options - { unreadOnly: boolean, limit: number }
 */
async function getNotifications(userId, options = {}) {
  const { unreadOnly = false, limit = 20 } = options;

  if (USE_DUMMY) {
    let results = dummy.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (unreadOnly) results = results.filter((n) => !n.is_read);

    results = results.slice(0, limit);

    const unreadCount = dummy.notifications.filter(
      (n) => n.user_id === userId && !n.is_read
    ).length;

    return {
      user_id: userId,
      unread_count: unreadCount,
      count: results.length,
      notifications: results,
    };
  }

  // [DB SWAP]:
  // const whereClause = unreadOnly
  //   ? `WHERE user_id = $1 AND is_read = FALSE`
  //   : `WHERE user_id = $1`;
  //
  // const { rows } = await pool.query(
  //   `SELECT * FROM notifications ${whereClause}
  //    ORDER BY created_at DESC LIMIT $2`,
  //   [userId, limit]
  // );
  // const { rows: countRows } = await pool.query(
  //   `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
  //   [userId]
  // );
  // return {
  //   user_id: userId,
  //   unread_count: parseInt(countRows[0].count),
  //   count: rows.length,
  //   notifications: rows,
  // };
}

/**
 * Mark a specific notification as read.
 * [DB SWAP] Replace dummy block with real pg UPDATE.
 */
async function markAsRead(userId, notificationId) {
  if (USE_DUMMY) {
    const notif = dummy.notifications.find(
      (n) => n.notification_id === notificationId && n.user_id === userId
    );
    if (!notif) throw new Error(`Notification "${notificationId}" not found for user "${userId}".`);
    notif.is_read = true;
    return notif;
  }

  // [DB SWAP]:
  // const { rows } = await pool.query(
  //   `UPDATE notifications SET is_read = TRUE
  //    WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
  //   [notificationId, userId]
  // );
  // if (!rows.length) throw new Error(`Notification not found.`);
  // return rows[0];
}

/**
 * Mark ALL notifications for a user as read.
 * [DB SWAP] Replace dummy block with real pg UPDATE.
 */
async function markAllAsRead(userId) {
  if (USE_DUMMY) {
    let count = 0;
    dummy.notifications.forEach((n) => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        count++;
      }
    });
    return { user_id: userId, marked_read: count };
  }

  // [DB SWAP]:
  // const { rowCount } = await pool.query(
  //   `UPDATE notifications SET is_read = TRUE
  //    WHERE user_id = $1 AND is_read = FALSE`,
  //   [userId]
  // );
  // return { user_id: userId, marked_read: rowCount };
}

/**
 * Get count of unread notifications for a user.
 * Used by frontend bell icon badge.
 */
async function getUnreadCount(userId) {
  if (USE_DUMMY) {
    const count = dummy.notifications.filter(
      (n) => n.user_id === userId && !n.is_read
    ).length;
    return { user_id: userId, unread_count: count };
  }

  // [DB SWAP]:
  // const { rows } = await pool.query(
  //   `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
  //   [userId]
  // );
  // return { user_id: userId, unread_count: parseInt(rows[0].count) };
}

module.exports = {
  enqueueNotification,  // called internally by other services
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
