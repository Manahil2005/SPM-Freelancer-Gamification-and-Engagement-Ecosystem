// =============================================================
// src/middleware/auth.js
// =============================================================
// Stub authentication middleware.
// In production: Module 1 will provide a JWT token.
// For now: we just require an x-user-id header to be present.
// =============================================================

/**
 * Ensures a valid user ID is present in the request.
 * Replace with real JWT verification when Module 1 is integrated.
 */
const requireUserId = (req, res, next) => {
  // Accept user ID from header OR route param
  const userId = req.headers["x-user-id"] || req.params.userId || req.body?.user_id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: x-user-id header is required.",
    });
  }

  req.userId = userId;
  next();
};

/**
 * Stub admin check middleware.
 * Replace with real role-based check from Module 1/8 when integrated.
 */
const requireAdmin = (req, res, next) => {
  const role = req.headers["x-user-role"];

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin role required.",
    });
  }

  next();
};

module.exports = { requireUserId, requireAdmin };
