const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/user");
const Product = require("../models/product");
const Post = require("../models/post");
const Brand = require("../models/brand");
const Order = require("../models/order");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connect to MongoDB");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
