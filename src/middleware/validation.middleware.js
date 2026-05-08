const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const allowedRoles = ["farmer", "retailer", "admin"];
const allowedOrderStatuses = ["accepted", "shipped", "delivered", "cancelled"];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const toPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const validateObjectIdParam = (paramName = "id") => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return next(new AppError("Invalid resource id", 400));
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return next(new AppError("Name, email and password are required", 400));
  }

  if (!allowedRoles.includes(role)) {
    return next(new AppError("A valid role is required", 400));
  }

  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  req.body.email = email.trim().toLowerCase();
  req.body.name = name.trim();
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return next(new AppError("Email and password are required", 400));
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

const validateProduct = (req, res, next) => {
  const { name, category, price, quantity } = req.body;
  const parsedPrice = toPositiveNumber(price);
  const parsedQuantity = toPositiveNumber(quantity);

  if (!isNonEmptyString(name) || !isNonEmptyString(category)) {
    return next(new AppError("Product name and category are required", 400));
  }

  if (parsedPrice === null || parsedQuantity === null) {
    return next(new AppError("Price and quantity must be positive numbers", 400));
  }

  req.body.name = name.trim();
  req.body.category = category.trim();
  req.body.price = parsedPrice;
  req.body.quantity = parsedQuantity;
  if (req.body.unit) req.body.unit = String(req.body.unit).trim();
  if (req.body.description) req.body.description = String(req.body.description).trim();
  next();
};

const validateOrder = (req, res, next) => {
  const { product, quantity } = req.body;
  const parsedQuantity = toPositiveNumber(quantity);

  if (!mongoose.Types.ObjectId.isValid(product)) {
    return next(new AppError("Valid product id is required", 400));
  }

  if (parsedQuantity === null) {
    return next(new AppError("Quantity must be a positive number", 400));
  }

  req.body.quantity = parsedQuantity;
  next();
};

const validateOrderStatus = (req, res, next) => {
  if (!allowedOrderStatuses.includes(req.body.status)) {
    return next(
      new AppError(`Invalid status. Allowed: ${allowedOrderStatuses.join(", ")}`, 400)
    );
  }
  next();
};

const validateCartItem = (req, res, next) => {
  const { product } = req.body;
  const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

  if (!mongoose.Types.ObjectId.isValid(product)) {
    return next(new AppError("Valid product id is required", 400));
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  req.body.quantity = quantity;
  next();
};

module.exports = {
  validateObjectIdParam,
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  validateOrderStatus,
  validateCartItem,
};
