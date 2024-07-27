const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Post = require("../models/post");
const { getAsync, setexAsync } = require("../config/redis");

const postController = {
  getAllPost: async (req, res) => {
    try {
      let { page, pageSize, title } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0 || pageSize <= 0) {
        return res.status(400).json({
          message: "Số lượng trang và phần tử phải là số dương",
          status: 400,
        });
      }

      const skip = (page - 1) * pageSize;

      let query = {};
      if (title) {
        query.title = { $regex: new RegExp(title, "i") };
      }

      const key = `posts:page:${page}:size:${pageSize}:title:${title || ""}`;

      try {
        const cachedData = await getAsync(key);
        if (cachedData) {
          return res.status(200).json(JSON.parse(cachedData));
        }

        const posts = await Post.find(query).skip(skip).limit(pageSize);
        const totalCount = await Post.countDocuments(query);

        if (totalCount === 0) {
          return res.status(404).json({
            message: "Không tìm thấy bài viết",
            status: 404,
          });
        }

        const response = {
          posts,
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          totalPosts: totalCount,
        };

        await setexAsync(key, 1800, JSON.stringify(response));

        return res.status(200).json(response);
      } catch (err) {
        return res.status(400).json(err);
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailPost: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }

      const postInfo = await Post.findById(req.params.id).populate("product");
      if (!postInfo) {
        return res.status(404).json({
          message: "Không tìm thấy bài viết",
          status: 404,
        });
      }

      res.status(200).json({ postInfo });
    } catch (err) {
      res.status(400).json(err);
    }
  },

  addPost: async (req, res) => {
    try {
      const { title, description, image, product } = req.body;

      if (!title || !description || !image || !product) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      if (!ObjectId.isValid(req.body.product)) {
        return res.status(400).json({
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }

      const post = await Post.create({
        title,
        description,
        image,
        product,
      });

      return res.status(200).json({
        message: "Thêm bài viết thành công",
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
          message: "ID của bài viết không hợp lệ",
          status: 400,
        });
      }

      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({
          message: "Không tìm thấy bài viết",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Xóa bài viết thành công",
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
          message: "ID của bài viết không hợp lệ",
          status: 400,
        });
      }

      if (!title || !description || !image) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
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
          message: "Cập nhật thành công",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Cập nhật thất bại",
          status: 400,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = postController;
