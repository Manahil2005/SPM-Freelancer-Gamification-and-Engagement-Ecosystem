// ============================================================
// middleware/auth.js
// Module 11 — Authentication Middleware
// ✅ WBS 5.1.2 — Authentication Middleware for API Security
// ============================================================

/**
 * requireUserId — WBS 5.1.6 / WBS 5.1.2
 * Verifies that a user ID is present in the request.
 * In a real deployment this would validate a JWT issued by Module 1.
 * For now it reads x-user-id and x-user-role headers (Module 1 contract).
 */
const requireUserId = (req, res, next) => {
    // Accept user id from header (set by API gateway / Module 1 auth)
    const userId = req.headers["x-user-id"] || req.body?.user_id;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: missing user ID" });
    }

    // Attach to request for downstream use
    req.userId   = parseInt(userId);
    req.userRole = req.headers["x-user-role"] || "freelancer";

    next();
};

/**
 * requireAdmin — WBS 5.1.2 — Role-based Access Control
 * Must be chained after requireUserId.
 */
const requireAdmin = (req, res, next) => {
    if (req.userRole !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden: admin access required" });
    }
    next();
};

module.exports = { requireUserId, requireAdmin };