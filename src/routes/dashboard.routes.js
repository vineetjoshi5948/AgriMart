const express = require("express");
const {
  getFarmerStats,
  getFarmerRecentOrders,
  getFarmerTopProducts,
} = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");
const { farmerOnly } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/farmer/stats", protect, farmerOnly, getFarmerStats);
router.get("/farmer/recent-orders", protect, farmerOnly, getFarmerRecentOrders);
router.get("/farmer/top-products", protect, farmerOnly, getFarmerTopProducts);

module.exports = router;
