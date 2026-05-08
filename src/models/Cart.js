const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Subtotal cannot be negative"],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Cart total cannot be negative"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
