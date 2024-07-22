const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/product");
const Post = require("../models/post");
const Order = require("../models/order");
const Brand = require("../models/brand");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
