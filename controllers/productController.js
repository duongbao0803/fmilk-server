const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Product = require("../models/product");
const Post = require("../models/post");
const User = require("../models/user");
const Brand = require("../models/brand");
const Fuse = require("fuse.js");
const { getAsync, setexAsync } = require("../config/redis");

const productController = {
  getAllProduct: async (req, res) => {
    try {
      let { page, pageSize, name, origin, minPrice, maxPrice } = req.query;
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
      if (origin) {
        const brands = await Brand.find({
          origin: { $regex: origin, $options: "i" },
        });
        const brandIds = brands.map((brand) => brand._id);
        query.brand = { $in: brandIds };
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) {
          query.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          query.price.$lte = parseFloat(maxPrice);
        }
      }

      const key = `products:page:${page}:size:${pageSize}:name:${
        name || ""
      }:origin:${origin || ""}:minPrice:${minPrice || ""}:maxPrice:${
        maxPrice || ""
      }`;

      try {
        const cachedData = await getAsync(key);
        if (cachedData) {
          return res.status(200).json(JSON.parse(cachedData));
        }

        let products = await Product.find(query).populate("brand");

        if (name) {
          const fuse = new Fuse(products, {
            keys: ["name"],
            threshold: 0.3,
          });
          products = fuse.search(name).map((result) => result.item);

          if (products.length === 0) {
            return res.status(404).json({
              message: "Không tìm thấy sản phẩm",
              status: 404,
            });
          }
        }

        const totalCount = products.length;
        const paginatedProducts = products.slice(skip, skip + pageSize);

        const response = {
          products: paginatedProducts,
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          totalProducts: totalCount,
        };

        await setexAsync(key, 1500, JSON.stringify(response));

        return res.status(200).json(response);
      } catch (err) {
        return res.status(400).json(err);
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailProduct: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }
      const productInfo = await Product.findById(req.params.id)
        .populate("brand")
        .populate({
          path: "comments.author",
          select: "name",
        });
      if (!productInfo) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm",
          status: 404,
        });
      }

      res.status(200).json({ productInfo });
    } catch (err) {
      res.status(400).json(err);
    }
  },

  addProduct: async (req, res) => {
    try {
      const { name, expireDate, quantity, price, image, description, brand } =
        req.body;
      const currentDate = new Date();
      const inputExpireDate = new Date(expireDate);
      const existingProduct = await Product.findOne({ name });

      if (!ObjectId.isValid(brand)) {
        return res.status(400).json({
          message: "ID của thương hiệu không hợp lệ",
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
        !brand
      ) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          message: "Sản phẩm đã tồn tại",
          status: 400,
        });
      }

      if (price <= 0 || quantity <= 0) {
        return res.status(400).json({
          message: "Giá sản phẩm và số lượng phải là số dương",
          status: 400,
        });
      }

      if (inputExpireDate < currentDate) {
        return res.status(400).json({
          message: "Ngày hết hạn phải trong tương lai",
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
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }

      const postsUsingProduct = await Post.findOne({
        product: req.params.id,
      });

      if (postsUsingProduct) {
        return res.status(400).json({
          message: "Không thể xóa sản phẩm. Sản phẩm còn nằm trong bài viết",
          status: 400,
        });
      }

      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Xóa thành công",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  updateProduct: async (req, res) => {
    const { name, image, description, quantity, price, brand } = req.body;
    const existingProduct = await Product.findOne({
      name,
      _id: { $ne: req.params.id },
    }).collation({ locale: "en", strength: 2 });

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          message: "Sản phẩm đã tồn tại",
          status: 400,
        });
      }

      if (!name || !image || !description || !quantity || !price || !brand) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      if (price <= 0 || quantity <= 0) {
        return res.status(400).json({
          message: "Giá sản phẩm và số lượng phải là số dương",
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
        },
        { new: true }
      );
      if (product) {
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

  //Comments
  addNewComment: async (req, res) => {
    const { rating, content } = req.body;

    try {
      if (!ObjectId.isValid(req.params.productId)) {
        return res.status(400).json({
          message: "ID của sản phẩm không hợp lệ",
          status: 400,
        });
      }

      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm",
          status: 404,
        });
      }

      const existingComment = await Product.findOne({
        _id: req.params.productId,
        "comments.author": req.user.id,
      });

      if (existingComment) {
        return res.status(404).json({
          message:
            "Người dùng chỉ được đánh giá và nhận xét 1 lần duy nhất trên mỗi sản phẩm",
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

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm",
          status: 404,
        });
      }

      const comment = product.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          message: "Không tìm thấy bình luận",
          status: 404,
        });
      }

      if (
        comment.author.toString() !== req.user.id.toString() &&
        req.user.role !== "ADMIN" &&
        req.user.role !== "STAFF"
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền xóa đánh giá này",
          status: 403,
        });
      }

      product.comments.pull(comment._id);
      await product.save();

      return res.status(200).json({
        message: "Xóa đánh giá thành công",
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
        message: "Mọi trường dữ liệu đều bắt buộc",
        status: 400,
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Đánh giá sản phẩm phải nằm trong khoảng 1 đến 5 sao",
        status: 400,
      });
    }

    if (content.length < 8) {
      return res.status(400).json({
        message: "Nhận xét phải có ít nhất 8 chữ",
        status: 400,
      });
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm",
          status: 400,
        });
      }

      const comment = product.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({
          message: "Không tìm thấy bình luận",
          status: 400,
        });
      }

      if (comment.author.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền chỉnh sửa đánh giá này",
          status: 403,
        });
      }

      comment.content = content;
      comment.rating = rating;

      await product.save();
      return res.status(200).json({
        message: "Cập nhật đánh giá thành công",
        status: 200,
      });
    } catch (err) {
      return res.status(400).send(err);
    }
  },
};

module.exports = productController;
