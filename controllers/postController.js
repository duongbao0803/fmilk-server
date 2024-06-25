const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Post = require("../models/post");
const Product = require("../models/product");

const postController = {
  getAllPost: async (req, res) => {
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
      const posts = await Post.find().skip(skip).limit(pageSize);
      const totalCount = await Post.countDocuments();

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Not found post",
          status: 404,
        });
      }

      return res.status(200).json({
        posts,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalPosts: totalCount,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailPost: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      const postInfo = await Post.findById(req.params.id);
      if (!postInfo) {
        return res.status(404).json({
          message: "Not found post",
          status: 404,
        });
      }

      res.status(200).json({ postInfo });
    } catch (err) {
      res.status(400).json(err);
    }
  },

  searchPost: async (req, res) => {
    try {
      const { title } = req.query;
      const posts = await Post.find({
        title: { $regex: title, $options: "i" },
      });

      if (posts.length === 0) {
        return res.status(404).json({ message: "Not found post" });
      }

      return res.status(200).json(posts);
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  addPost: async (req, res) => {
    try {
      const { title, description, image, productId } = req.body;

      if (!title || !description || !image || !productId) {
        return res.status(400).json({
          message: "All fields must be required",
          status: 400,
        });
      }

      if (!ObjectId.isValid(req.body.productId)) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      const post = await Post.create({
        title,
        description,
        image,
        productId,
      });

      return res.status(200).json({
        message: "Add Successful",
        status: 200,
        post,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  deletePost: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid post ID",
          status: 400,
        });
      }

      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({
          message: "Not found post",
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

  updatePost: async (req, res) => {
    const { title, description, image, productId } = req.body;

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid post ID",
          status: 400,
        });
      }

      if (!title || !description || !image) {
        return res.status(400).json({
          message: "All fields must be required",
          status: 400,
        });
      }

      const post = await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          image,
          description,
          productId,
        },
        { new: true }
      );
      if (post) {
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
      return res.status(400).json(err);
    }
  },
};

module.exports = postController;
