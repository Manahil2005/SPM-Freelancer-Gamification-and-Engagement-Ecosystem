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
    // TEMP: allow requests with user ID in URL params
    const userId =
        req.headers["x-user-id"] ||
        req.headers["x-user-id".toLowerCase()] ||
        req.body?.user_id ||
        req.query?.user_id ||
        req.params?.userId;  // ← add this line

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: missing user ID" });
    }

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