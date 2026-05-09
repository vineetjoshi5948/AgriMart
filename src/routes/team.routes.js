const express = require("express");
const router = express.Router();
const {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require("../controllers/team.controller");
const { protect } = require("../middleware/auth.middleware");
const { farmerOnly } = require("../middleware/role.middleware");
const { validateObjectIdParam } = require("../middleware/validation.middleware");

router.use(protect);
router.use(farmerOnly);

router.get("/", getTeamMembers);
router.post("/", addTeamMember);
router.put("/:id", validateObjectIdParam(), updateTeamMember);
router.delete("/:id", validateObjectIdParam(), deleteTeamMember);

module.exports = router;
