// =============================================================
// src/controllers/notificationController.js
// WBS 3.3.3 — Notification API endpoint handlers
// =============================================================

const notificationService = require("../services/notificationService");

/**
 * GET /api/notifications/:userId
 * Query params: ?unread_only=true&limit=20
 * Returns all (or unread-only) notifications for a user.
 * REQ-38, REQ-40
 */
async function getNotifications(req, res) {
  try {
    const { userId } = req.params;
    const unreadOnly = req.query.unread_only === "true";
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await notificationService.getNotifications(userId, { unreadOnly, limit });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[Notifications] getNotifications error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * GET /api/notifications/:userId/unread-count
 * Returns only the unread notification count.
 * Used by the frontend bell icon badge (WBS 4.5.1).
 * REQ-40
 */
async function getUnreadCount(req, res) {
  try {
    const { userId } = req.params;

    const result = await notificationService.getUnreadCount(userId);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[Notifications] getUnreadCount error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * PUT /api/notifications/:userId/:notificationId/read
 * Marks a single notification as read.
 * REQ-39
 */
async function markAsRead(req, res) {
  try {
    const { userId, notificationId } = req.params;

    const result = await notificationService.markAsRead(userId, notificationId);

    return res.status(200).json({ success: true, notification: result });
  } catch (err) {
    console.error("[Notifications] markAsRead error:", err.message);

    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * PUT /api/notifications/:userId/read-all
 * Marks ALL notifications for a user as read.
 * REQ-39
 */
async function markAllAsRead(req, res) {
  try {
    const { userId } = req.params;

    const result = await notificationService.markAllAsRead(userId);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[Notifications] markAllAsRead error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

/**
 * POST /api/notifications/send
 * Manually dispatch a notification (for testing or admin use).
 * Body: { user_id, type, message }
 */
async function sendNotification(req, res) {
  try {
    const { user_id, type, message } = req.body;

    if (!user_id || !type) {
      return res.status(400).json({
        success: false,
        error: "Fields 'user_id' and 'type' are required.",
      });
    }

    const VALID_TYPES = ["points", "level", "badge", "challenge"];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    notificationService.enqueueNotification(user_id, type, message);

    return res.status(202).json({
      success: true,
      message: "Notification queued for delivery.",
    });
  } catch (err) {
    console.error("[Notifications] sendNotification error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, sendNotification };
