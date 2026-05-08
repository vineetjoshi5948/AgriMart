const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// ─── POST /api/orders ─────────────────────────────────────────
// Retailer places an order.
// Body: { product: "<id>", quantity: 2 }
// ───────────────────────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const { product: productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const updatedProduct = await Product.findOneAndUpdate(
    { _id: productId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { returnDocument: "after" }
  );

  if (!updatedProduct) {
    throw new AppError(
      `Insufficient stock for "${product.name}". Available: ${product.quantity}`,
      400
    );
  }

  let order;
  try {
    order = await Order.create({
      retailer: req.user._id,
      farmer: product.farmer,
      product: productId,
      quantity,
      totalPrice: product.price * quantity,
    });
  } catch (error) {
    await Product.findByIdAndUpdate(productId, { $inc: { quantity } });
    throw error;
  }

  const populated = await Order.findById(order._id)
    .populate("retailer", "name email")
    .populate("farmer", "name email")
    .populate("product", "name category unit price image");

  res.status(201).json({
    success: true,
    data: populated,
  });
});

// ─── GET /api/orders/my-orders ────────────────────────────────
// Retailer views their own orders.
// ───────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ retailer: req.user._id })
    .populate("farmer", "name email")
    .populate("product", "name category unit image")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, data: orders });
});

// ─── GET /api/orders/farmer-orders ───────────────────────────────
// Farmer views orders they've received from retailers.
// ───────────────────────────────────────────────────────────────
const getFarmerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ farmer: req.user._id })
    .populate("retailer", "name email")
    .populate("product", "name category unit image")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, data: orders });
});

// ─── GET /api/orders/:id ─────────────────────────────────────
// Get a single order (accessible by its retailer or farmer).
// ───────────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("retailer", "name email")
    .populate("farmer", "name email")
    .populate("product", "name category unit image price");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const userId = req.user._id.toString();
  if (
    order.retailer._id.toString() !== userId &&
    order.farmer._id.toString() !== userId &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized to view this order", 403);
  }

  res.json({ success: true, data: order });
});

// ─── PUT /api/orders/:id/status ──────────────────────────────
// Farmer updates order status (accepted → shipped → delivered).
// Also supports cancellation by either party while still pending.
// Body: { status: "accepted" }
// ───────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const userId = req.user._id.toString();
  const isFarmer = order.farmer.toString() === userId;
  const isRetailer = order.retailer.toString() === userId;

  if (status === "cancelled") {
    if (!isFarmer && !isRetailer && req.user.role !== "admin") {
      throw new AppError("Not authorized", 403);
    }
    if (order.orderStatus !== "pending") {
      throw new AppError("Only pending orders can be cancelled", 400);
    }

    await Product.findByIdAndUpdate(order.product, {
      $inc: { quantity: order.quantity },
    });
  } else {
    if (!isFarmer) {
      throw new AppError("Only the farmer can update order status", 403);
    }

    const transitions = {
      pending: "accepted",
      accepted: "shipped",
      shipped: "delivered",
    };

    if (transitions[order.orderStatus] !== status) {
      throw new AppError(
        `Cannot change status from '${order.orderStatus}' to '${status}'`,
        400
      );
    }
  }

  order.orderStatus = status;
  await order.save();

  const populated = await Order.findById(order._id)
    .populate("retailer", "name email")
    .populate("farmer", "name email")
    .populate("product", "name category unit image price");

  res.json({ success: true, data: populated });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
};
