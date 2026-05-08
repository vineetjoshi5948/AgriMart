const express = require("express");
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controller");
const { protect } = require("../middleware/auth.middleware");
const { retailerOnly } = require("../middleware/role.middleware");
const { validateObjectIdParam, validateCartItem } = require("../middleware/validation.middleware");

const router = express.Router();

router.use(protect, retailerOnly);

router.get("/", getCart);
router.post("/add", validateCartItem, addCartItem);
router.put("/update/:productId", validateObjectIdParam("productId"), updateCartItem);
router.delete("/remove/:productId", validateObjectIdParam("productId"), removeCartItem);
router.delete("/clear", clearCart);

// Backward-compatible aliases used by the current vanilla JS frontend.
router.post("/", validateCartItem, addCartItem);
router.put("/:productId", validateObjectIdParam("productId"), updateCartItem);
router.delete("/:productId", validateObjectIdParam("productId"), removeCartItem);
router.delete("/", clearCart);

module.exports = router;
