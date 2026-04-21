// =============================================================
// src/routes/notifications.js
// WBS 3.3 — Notification Routes
// =============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/notificationController");

// GET  /api/notifications/:userId                        → get all (or unread) notifications
router.get("/:userId", ctrl.getNotifications);

// GET  /api/notifications/:userId/unread-count           → get unread count only
router.get("/:userId/unread-count", ctrl.getUnreadCount);

// PUT  /api/notifications/:userId/read-all               → mark all as read
router.put("/:userId/read-all", ctrl.markAllAsRead);

// PUT  /api/notifications/:userId/:notificationId/read   → mark one as read
router.put("/:userId/:notificationId/read", ctrl.markAsRead);

// POST /api/notifications/send                           → manually dispatch a notification
router.post("/send", ctrl.sendNotification);

module.exports = router;
