// =============================================================
// src/routes/trustScore.js
// WBS 3.2 — Trust Score Routes
// =============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/trustScoreController");

// GET  /api/user/:userId/trust-score          → fetch current score
router.get("/:userId/trust-score", ctrl.getTrustScore);

// POST /api/user/:userId/trust-score/recalculate → trigger recalculation
router.post("/:userId/trust-score/recalculate", ctrl.recalculateTrustScore);

// GET  /api/user/:userId/trust-score/history  → score history
router.get("/:userId/trust-score/history", ctrl.getTrustScoreHistory);

module.exports = router;
