const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/user");
const Product = require("../models/product");
const Post = require("../models/post");
const Order = require("../models/order");
const Brand = require("../models/brand");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://baodtse171065:duongtonbaomx1@cluster0.qzvsx5g.mongodb.net/"
    );
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
