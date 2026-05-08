const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const populateCart = (query) =>
  query.populate({
    path: "items.product",
    select: "name category price quantity unit image farmer",
    populate: { path: "farmer", select: "name email" },
  });

const recalculateCart = async (cart) => {
  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).select("price");
  const priceById = new Map(products.map((product) => [product._id.toString(), product.price]));

  cart.items.forEach((item) => {
    const price = priceById.get(item.product.toString()) || 0;
    item.subtotal = price * item.quantity;
  });

  cart.totalPrice = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  return cart;
};

const getOrCreateCart = async (retailerId) => {
  let cart = await Cart.findOne({ retailer: retailerId });

  if (!cart) {
    cart = await Cart.create({ retailer: retailerId, items: [] });
  }

  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cartDoc = await getOrCreateCart(req.user._id);
  await recalculateCart(cartDoc);
  await cartDoc.save();
  const cart = await populateCart(Cart.findById(cartDoc._id));
  res.json({ success: true, data: cart });
});

const addCartItem = asyncHandler(async (req, res) => {
  const { product: productId } = req.body;
  const quantity = Number(req.body.quantity) || 1;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (quantity > product.quantity) {
    throw new AppError(`Only ${product.quantity} ${product.unit || "kg"} available`, 400);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => item.product.toString() === productId);

  if (existing) {
    existing.quantity += quantity;
    if (existing.quantity > product.quantity) {
      throw new AppError(`Only ${product.quantity} ${product.unit || "kg"} available`, 400);
    }
    existing.subtotal = existing.quantity * product.price;
  } else {
    cart.items.push({ product: productId, quantity, subtotal: product.price * quantity });
  }

  await recalculateCart(cart);
  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.status(201).json({ success: true, data: populated });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);

  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((cartItem) => cartItem.product.toString() === req.params.productId);

  if (!item) {
    throw new AppError("Product is not in cart", 404);
  }

  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (quantity > product.quantity) {
    throw new AppError(`Only ${product.quantity} ${product.unit || "kg"} available`, 400);
  }

  item.quantity = quantity;
  item.subtotal = product.price * quantity;
  await recalculateCart(cart);
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, data: populated });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await recalculateCart(cart);
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, data: populated });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  res.json({ success: true, data: cart });
});

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
