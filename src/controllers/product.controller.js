const Product = require("../models/Product");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const getUploadedImagePath = (req) => {
  if (!req.file) return null;
  return `/uploads/${req.file.filename}`;
};

const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, quantity, unit, description, image } = req.body;

  const product = await Product.create({
    farmer: req.user._id,
    name,
    category,
    price,
    quantity,
    unit,
    description,
    image: getUploadedImagePath(req) || image || "",
  });

  res.status(201).json({ success: true, data: product });
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, fallback, fieldName, max) => {
  if (value === undefined || value === "") return fallback;

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  return max ? Math.min(number, max) : number;
};

const parsePrice = (value, fieldName) => {
  if (value === undefined || value === "") return null;

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(`${fieldName} must be a valid non-negative number`, 400);
  }

  return number;
};

const getSortOption = (sort = "newest") => {
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1, createdAt: -1 },
    price_desc: { price: -1, createdAt: -1 },
  };

  if (!sortOptions[sort]) {
    throw new AppError("Invalid sort option", 400);
  }

  return sortOptions[sort];
};

const getProducts = asyncHandler(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1, "page");
  const limit = parsePositiveInteger(req.query.limit, 12, "limit", 50);
  const skip = (page - 1) * limit;
  const { search, category, farmer } = req.query;
  const minPrice = parsePrice(req.query.minPrice, "minPrice");
  const maxPrice = parsePrice(req.query.maxPrice, "maxPrice");
  const sort = getSortOption(req.query.sort);
  const filter = {};

  if (search) {
    filter.name = new RegExp(escapeRegex(String(search).trim()), "i");
  }

  if (category && category !== "All") {
    filter.category = category;
  }

  if (farmer) {
    if (!mongoose.Types.ObjectId.isValid(farmer)) {
      throw new AppError("farmer must be a valid id", 400);
    }
    filter.farmer = farmer;
  }

  if (minPrice !== null || maxPrice !== null) {
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      throw new AppError("minPrice cannot be greater than maxPrice", 400);
    }

    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("farmer", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: products.length,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      totalProducts: total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.farmer.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to update this product", 403);
  }

  const updates = { ...req.body };
  const uploadedImage = getUploadedImagePath(req);
  if (uploadedImage) {
    updates.image = uploadedImage;
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  res.json({ success: true, data: updatedProduct });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (req.user.role !== "admin" && product.farmer.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to delete this product", 403);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "Product deleted" });
});

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
