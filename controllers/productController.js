const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Product = require("../models/product");
const Post = require("../models/post");
const User = require("../models/user");

const productController = {
  getAllProduct: async (req, res) => {
    try {
      let { page, pageSize, productName, origin } = req.query;
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

      let query = {};
      if (productName) {
        query.name = { $regex: productName, $options: "i" };
      }

      if (origin) {
        query.origin = origin;
      }

      const products = await Product.find(query).skip(skip).limit(pageSize);
      const totalCount = await Product.countDocuments(query);

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Not found product",
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
          message: "Not found product",
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
        image,
        description,
        origin,
        brand,
      } = req.body;
      const currentDate = new Date();
      const inputExpireDate = new Date(expireDate);
      const existingProduct = await Product.findOne({ name });

      if (!ObjectId.isValid(brand)) {
        return res.status(400).json({
          message: "Invalid brand ID",
          status: 400,
        });
      }

      if (
        !name ||
        !inputExpireDate ||
        !quantity ||
        !price ||
        !image ||
        !description ||
        !origin ||
        !brand
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

      if (inputExpireDate < currentDate) {
        return res.status(400).json({
          message: "Expire date must be a in future",
          status: 400,
        });
      }

      const newProduct = Product.create({
        name,
        expireDate: inputExpireDate,
        quantity,
        price,
        image,
        description,
        origin,
        brand,
      });
      return res.status(200).json(newProduct);
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

      const postsUsingProduct = await Post.findOne({
        productId: req.params.id,
      });

      if (postsUsingProduct) {
        return res.status(400).json({
          message: "Cannot delete product. It still exist in post",
          status: 400,
        });
      }

      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({
          message: "Not found product",
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
    const { name, image, description, quantity, price, origin, brand } =
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
        !price ||
        !origin ||
        !brand
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

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          image,
          description,
          quantity,
          price,
          brand,
          origin,
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

  //Comments
  addNewComment: async (req, res) => {
    const { rating, content } = req.body;
    console.log("check body", req.body);

    try {
      if (!ObjectId.isValid(req.params.productId)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      const product = await Product.findById(req.params.productId);
      console.log("checkl product", product);
      if (!product) {
        return res.status(404).json({
          message: "Not found product",
          status: 404,
        });
      }

      const existingComment = await Product.findOne({
        _id: req.params.productId,
        "comments.author": req.user.id,
      });

      if (existingComment) {
        return res.status(404).json({
          message: "User can only comment once on each product",
          status: 404,
        });
      }

      const user = await User.findById(req.user.id);

      const newComment = {
        rating: rating,
        content: content,
        author: user._id,
      };

      product.comments.push(newComment);
      await product.save();

      return res.status(200).json(product.comments);
    } catch (err) {
      res.status(400).json(err);
    }
  },

  deleteComment: async (req, res) => {
    const { productId, commentId } = req.params;
    console.log("check id", productId);
    console.log("check commentId", commentId);

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: "Not found product",
          status: 404,
        });
      }

      const comment = product.comments.id(commentId);

      console.log("check", req.user.role);

      if (!comment) {
        return res.status(404).json({
          message: "Not found comment",
          status: 404,
        });
      }

      if (
        comment.author.toString() !== req.user.id.toString() &&
        req.user.role !== "ADMIN" &&
        req.user.role !== "STAFF"
      ) {
        return res.status(403).json({
          message: "You don't have permission to delete comment",
          status: 403,
        });
      }

      product.comments.pull(comment._id);
      await product.save();

      return res.status(200).json({
        message: "Delete comment successful",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  editComment: async (req, res) => {
    const { productId, commentId } = req.params;
    const { rating, content } = req.body;

    if (!rating || !content) {
      return res.status(400).json({
        message: "All fields must be required",
        status: 400,
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
        status: 400,
      });
    }

    if (content.length < 8) {
      return res.status(400).json({
        message: "Content must be at least 8 characters",
        status: 400,
      });
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: "Not found product",
          status: 400,
        });
      }

      const comment = product.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({
          message: "Not found comment",
          status: 400,
        });
      }

      if (comment.author.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          message: "You don't have permission to edit comment",
          status: 403,
        });
      }

      comment.content = content;
      comment.rating = rating;

      await product.save();
      return res.status(200).json({
        message: "Edit comment successful",
        status: 200,
      });
    } catch (err) {
      return res.status(400).send(err);
    }
  },
};

module.exports = productController;
