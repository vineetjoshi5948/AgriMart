const express = require("express");
const { protect } = require("../middleware/auth.middleware.js");

const router = express.Router();

const {
  registerUser,
  loginUser
} = require("../controllers/auth.controller.js");
const { validateRegister, validateLogin } = require("../middleware/validation.middleware.js");

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.get("/profile", protect, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
