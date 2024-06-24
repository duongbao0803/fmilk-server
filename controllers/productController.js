const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Product = require("../models/product");

const productController = {
  getAllProduct: async (req, res) => {
    try {
      let { page, pageSize } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0) {
        return res.status(400).json({
          message: "Page number must be a positive integer",
          status: 400,
        });
      }

      if (pageSize <= 0) {
        return res.status(400).json({
          message: "Page size must be a positive integer",
          status: 400,
        });
      }

      const skip = (page - 1) * pageSize;
      const products = await Product.find().skip(skip).limit(pageSize);
      const totalCount = await Product.countDocuments();

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Product not found",
          status: 404,
        });
      }

      return res.status(200).json({
        products,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalProducts: totalCount,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailProduct: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }
      const productInfo = await Product.findById(req.params.id);
      if (!productInfo) {
        return res.status(404).json({
          message: "Product not found",
          status: 404,
        });
      }

      res.status(200).json({ productInfo });
    } catch (err) {
      console.log("check err", err);
      res.status(400).json(err);
    }
  },

  addProduct: async (req, res) => {
    try {
      const {
        name,
        expireDate,
        quantity,
        price,
        rating,
        image,
        typeOfProduct,
        description,
      } = req.body;
      const currentDate = new Date();
      const inputExpireDate = new Date(expireDate);
      const existingProduct = await Product.findOne({ name });

      if (
        !name ||
        !expireDate ||
        !quantity ||
        !price ||
        !rating ||
        !image ||
        !typeOfProduct ||
        !description
      ) {
        return res.status(400).json({
          message: "All fields must be required",
          status: 400,
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          message: "Product already exists",
          status: 400,
        });
      }

      if (price < 0 || quantity < 0) {
        return res.status(400).json({
          message: "Price and quantity must be positive numbers",
          status: 400,
        });
      }

      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be in the range 1 to 5",
          status: 400,
        });
      }

      if (inputExpireDate < currentDate) {
        return res.status(400).json({
          message: "Expire date must be a in future",
          status: 400,
        });
      }

      const newProduct = new Product(req.body);
      const product = await newProduct.save();
      return res.status(200).json(product);
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  deleteProduct: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Delete Successful",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  updateProduct: async (req, res) => {
    const { name, image, description, quantity, typeOfProduct, price, rating } =
      req.body;
    const existingProduct = await Product.findOne({
      name,
      _id: { $ne: req.params.id },
    }).collation({ locale: "en", strength: 2 });

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          message: "Product is existed",
          status: 400,
        });
      }

      if (
        !name ||
        !image ||
        !description ||
        !quantity ||
        !typeOfProduct ||
        !price ||
        !rating
      ) {
        return res.status(400).json({
          message: "All fields must be required",
          status: 400,
        });
      }

      if (price < 0 || quantity < 0) {
        return res.status(400).json({
          message: "Price, quantity must be positive number",
        });
      }

      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be in range 1 -> 5",
        });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          image,
          description,
          quantity,
          typeOfProduct,
          price,
          rating,
        },
        { new: true }
      );
      if (product) {
        return res.status(200).json({
          message: "Update Successful",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Update failed",
          status: 400,
        });
      }
    } catch (err) {
      console.log("check err", err);
      return res.status(400).json(err);
    }
  },
};

module.exports = productController;
