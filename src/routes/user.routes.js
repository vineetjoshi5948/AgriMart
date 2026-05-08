const express = require("express");

const router = express.Router();

const {
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller.js");

const { protect } = require("../middleware/auth.middleware.js");
const { adminOnly } = require("../middleware/role.middleware.js");
const { validateObjectIdParam } = require("../middleware/validation.middleware.js");

router.get("/", protect, adminOnly, getUsers);
router.put("/:id", protect, adminOnly, validateObjectIdParam(), updateUser);
router.delete("/:id", protect, adminOnly, validateObjectIdParam(), deleteUser);

module.exports = router;
