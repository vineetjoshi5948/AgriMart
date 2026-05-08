const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const REVENUE_STATUSES = ["accepted", "delivered"];
const ORDER_STATUSES = ["pending", "accepted", "shipped", "delivered", "cancelled"];

const parseThreshold = (value) => {
  if (value === undefined || value === "") {
    return Number(process.env.LOW_STOCK_THRESHOLD) || 20;
  }

  const threshold = Number(value);
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new AppError("lowStockThreshold must be a non-negative number", 400);
  }

  return threshold;
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildMonthlyTemplate = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleString("en-IN", { month: "short" }),
      revenue: 0,
      orders: 0,
    };
  });
};

const getFarmerStats = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user._id);
  const lowStockThreshold = parseThreshold(req.query.lowStockThreshold);
  const monthTemplate = buildMonthlyTemplate();
  const firstMonth = new Date(`${monthTemplate[0].key}-01T00:00:00.000Z`);

  const [
    totalProducts,
    totalOrders,
    revenueAgg,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    statusAgg,
    monthlyAgg,
  ] = await Promise.all([
    Product.countDocuments({ farmer: farmerId }),
    Order.countDocuments({ farmer: farmerId }),
    Order.aggregate([
      { $match: { farmer: farmerId, orderStatus: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]),
    Order.countDocuments({ farmer: farmerId, orderStatus: "pending" }),
    Order.countDocuments({ farmer: farmerId, orderStatus: "delivered" }),
    Product.find({ farmer: farmerId, quantity: { $lte: lowStockThreshold } })
      .select("name category quantity unit price image")
      .sort({ quantity: 1, createdAt: -1 })
      .limit(8),
    Order.aggregate([
      { $match: { farmer: farmerId } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      {
        $match: {
          farmer: farmerId,
          orderStatus: { $in: REVENUE_STATUSES },
          createdAt: { $gte: firstMonth },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const statusDistribution = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusAgg.forEach((item) => {
    statusDistribution[item._id] = item.count;
  });

  const monthlyByKey = new Map(
    monthlyAgg.map((item) => [
      `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      { revenue: item.revenue, orders: item.orders },
    ])
  );

  const monthlySales = monthTemplate.map((month) => ({
    ...month,
    ...(monthlyByKey.get(month.key) || {}),
  }));

  res.json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      pendingOrders,
      deliveredOrders,
      lowStockCount: lowStockProducts.length,
      lowStockThreshold,
      lowStockProducts,
      monthlySales,
      statusDistribution,
    },
  });
});

const getFarmerRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
  const orders = await Order.find({ farmer: req.user._id })
    .populate("retailer", "name email")
    .populate("product", "name category unit image")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ success: true, count: orders.length, data: orders });
});

const getFarmerTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
  const farmerId = new mongoose.Types.ObjectId(req.user._id);

  const products = await Order.aggregate([
    { $match: { farmer: farmerId, orderStatus: { $in: REVENUE_STATUSES } } },
    {
      $group: {
        _id: "$product",
        totalQuantity: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1, totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: { $ifNull: ["$product.name", "Deleted product"] },
        category: "$product.category",
        image: "$product.image",
        unit: "$product.unit",
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
      },
    },
  ]);

  res.json({ success: true, count: products.length, data: products });
});

module.exports = {
  getFarmerStats,
  getFarmerRecentOrders,
  getFarmerTopProducts,
};
