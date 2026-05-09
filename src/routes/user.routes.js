const express = require("express");

const router = express.Router();

const {
  getUsers,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} = require("../controllers/user.controller.js");

const { protect } = require("../middleware/auth.middleware.js");
const { adminOnly, authorize } = require("../middleware/role.middleware.js");
const { validateObjectIdParam } = require("../middleware/validation.middleware.js");

// Profile routes (Any authenticated user)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin only routes
router.get("/", protect, adminOnly, getUsers);
router.put("/:id", protect, adminOnly, validateObjectIdParam(), updateUser);
router.delete("/:id", protect, adminOnly, validateObjectIdParam(), deleteUser);

module.exports = router;
