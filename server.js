const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error.middleware");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));

// ── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Farmer Marketplace API Running..." });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",     require("./src/routes/auth.routes.js"));
app.use("/api/products", require("./src/routes/product.routes.js"));
app.use("/api/orders",   require("./src/routes/order.routes.js"));
app.use("/api/users",    require("./src/routes/user.routes.js"));
app.use("/api/cart",     require("./src/routes/cart.routes.js"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes.js"));
app.use("/api/team",      require("./src/routes/team.routes.js"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
