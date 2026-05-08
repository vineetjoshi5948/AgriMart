/**
 * Role-based authorization middleware.
 *
 * Usage:  router.post("/", protect, authorize("retailer"), handler)
 *
 * Must be placed AFTER the `protect` middleware so that
 * `req.user` is already populated with the authenticated user.
 *
 * @param  {...string} roles  One or more allowed roles (e.g. "farmer", "retailer", "admin")
 * @returns {Function}        Express middleware
 */
const AppError = require("../utils/AppError");

const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware
    if (!req.user) {
      return next(new AppError("Not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403)
      );
    }

    next();
  };
};

// Specific role middlewares
const farmerOnly = authorize("farmer");
const retailerOnly = authorize("retailer");
const adminOnly = authorize("admin");
const farmerOrAdmin = authorize("farmer", "admin");

module.exports = { authorize, farmerOnly, retailerOnly, adminOnly, farmerOrAdmin };
