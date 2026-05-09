const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// @desc    Get all team members for a farmer
// @route   GET /api/team
// @access  Private (Farmer only)
const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({ farmer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: members });
});

// @desc    Add a new team member
// @route   POST /api/team
// @access  Private (Farmer only)
const addTeamMember = asyncHandler(async (req, res) => {
  const { name, role, phone, status } = req.body;

  if (!name || !role || !phone) {
    throw new AppError("Please provide name, role and phone", 400);
  }

  const member = await TeamMember.create({
    farmer: req.user._id,
    name,
    role,
    phone,
    status: status || "Active"
  });

  res.status(201).json({ success: true, data: member });
});

// @desc    Update a team member
// @route   PUT /api/team/:id
// @access  Private (Farmer only)
const updateTeamMember = asyncHandler(async (req, res) => {
  let member = await TeamMember.findById(req.params.id);

  if (!member) {
    throw new AppError("Team member not found", 404);
  }

  // Check ownership
  if (member.farmer.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to update this member", 403);
  }

  member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: member });
});

// @desc    Delete a team member
// @route   DELETE /api/team/:id
// @access  Private (Farmer only)
const deleteTeamMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findById(req.params.id);

  if (!member) {
    throw new AppError("Team member not found", 404);
  }

  // Check ownership
  if (member.farmer.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to delete this member", 403);
  }

  await member.deleteOne();
  res.json({ success: true, message: "Member removed" });
});

module.exports = {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember
};
