const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./user");
const productRoutes = require("./product");
const postRoutes = require("./post");
const orderRoutes = require("./order");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/product", productRoutes);
router.use("/post", postRoutes);
router.use("/order", orderRoutes);

module.exports = router;
