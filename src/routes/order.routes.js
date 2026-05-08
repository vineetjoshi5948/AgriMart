const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller.js");

const { protect } = require("../middleware/auth.middleware.js");
const { authorize, retailerOnly } = require("../middleware/role.middleware.js");
const {
  validateObjectIdParam,
  validateOrder,
  validateOrderStatus,
} = require("../middleware/validation.middleware.js");

// ── Retailer routes ──────────────────────────────────────────
// POST   /api/orders          → retailer places an order
// GET    /api/orders/my-orders → retailer sees their own orders
router.post("/", protect, retailerOnly, validateOrder, placeOrder);
router.get("/my-orders", protect, retailerOnly, getMyOrders);

// ── Farmer routes ────────────────────────────────────────────
// GET    /api/orders/farmer-orders  → farmer sees orders received
router.get("/farmer-orders", protect, authorize("farmer"), getFarmerOrders);

// ── Shared routes ────────────────────────────────────────────
// GET    /api/orders/:id       → either party views a single order
// PUT    /api/orders/:id/status → farmer updates status (or either cancels)
router.get("/:id", protect, validateObjectIdParam(), getOrderById);
router.put("/:id/status", protect, validateObjectIdParam(), validateOrderStatus, updateOrderStatus);

module.exports = router;
