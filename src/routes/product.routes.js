const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller.js");

const { protect } = require("../middleware/auth.middleware.js");
const { farmerOnly, farmerOrAdmin } = require("../middleware/role.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const { validateObjectIdParam, validateProduct } = require("../middleware/validation.middleware.js");

router.post("/", protect, farmerOnly, upload.single("image"), validateProduct, createProduct);
router.get("/", getProducts);
router.put("/:id", protect, farmerOnly, validateObjectIdParam(), upload.single("image"), updateProduct);
router.delete("/:id", protect, farmerOrAdmin, validateObjectIdParam(), deleteProduct);

module.exports = router;
