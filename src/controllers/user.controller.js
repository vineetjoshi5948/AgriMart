const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  const allowedUpdates = [
    "name", "email", "phone", "location", 
    "farmName", "farmSize", "primaryCrops", "certification"
  ];
  
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const updatedUser = await user.save();
  res.json({ success: true, data: updatedUser });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, count: users.length, data: users });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const allowedUpdates = {};
  ["name", "email", "role"].forEach((field) => {
    if (req.body[field] !== undefined) allowedUpdates[field] = req.body[field];
  });

  const updatedUser = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
    returnDocument: "after",
    runValidators: true,
  }).select("-password");

  res.json({ success: true, data: updatedUser });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "User deleted" });
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
};
