const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const AppError = require("../utils/AppError");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return next(new AppError("Not authorized", 401));
      }

      return next();
    } catch (error) {
      return next(new AppError("Not authorized", 401));
    }
  }

  if (!token) {
    return next(new AppError("No token provided", 401));
  }
};

module.exports = {
  protect,
};
