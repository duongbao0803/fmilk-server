const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

const orderController = {
  getAllOrder: async (req, res) => {
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

      const orders = await Order.find().skip(skip).limit(pageSize);
      const totalCount = await Order.countDocuments();

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Not found order",
          status: 404,
        });
      }

      return res.status(200).json({
        orders,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalOrders: totalCount,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailOrder: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid order ID",
          status: 400,
        });
      }

      const orderInfo = await Order.findById(req.params.id);
      if (!orderInfo) {
        return res.status(404).json({
          message: "Not found order",
          status: 404,
        });
      }

      return res.status(200).json({ orderInfo });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  createOrder: async (req, res) => {
    try {
      const {
        orderProducts,
        userId,
        paymentMethod,
        itemsPrice,
        transferPrice,
        totalPrice,
        transferAddress,
      } = req.body;

      const errors = [];
      const { fullName, address, phone } = transferAddress;

      if (!fullName || !address || !phone) {
        errors.push("All fields in transfer address are required");
      }

      if (!orderProducts || orderProducts.length === 0) {
        errors.push("No order product found");
      }

      if (!paymentMethod || !itemsPrice || !transferPrice || !totalPrice) {
        errors.push("All fields in payment are required");
      }

      const invalidProducts = orderProducts.filter(
        (product) => !product.amount
      );

      if (invalidProducts.length > 0) {
        errors.push("All fields in order product must be required");
      }

      const orderProductIds = orderProducts.map((product) => product.productId);
      const existingProducts = await Product.find({
        _id: { $in: orderProductIds },
      });

      if (existingProducts.length !== orderProductIds.length) {
        return res.status(404).json({
          message: "Some products in order not found",
          status: 404,
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: errors,
          status: 400,
        });
      }

      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            message: "Not found user",
            status: 404,
          });
        }
        if (user.role.includes("ADMIN") || user.role.includes("STAFF")) {
          return res.status(403).json({
            message: "Admin and Staff don't have permission to order",
            status: 403,
          });
        }
        if (paymentMethod === "VNPAY" && user.role.includes("MEMBER")) {
          // xử lý vnpay
        }
      } else {
        //
      }

      const detailOrderProducts = await Promise.all(
        orderProducts.map(async (product) => {
          const foundProduct = await Product.findById(product.productId);
          if (!foundProduct) {
            errors.push("Not found product");
          }
          return {
            productId: product.productId,
            name: foundProduct.name,
            image: foundProduct.image,
            amount: product.amount,
            price: foundProduct.price,
          };
        })
      );

      for (const product of detailOrderProducts) {
        const foundProduct = await Product.findById(product.productId);
        if (foundProduct.status.includes("AVAILABLE")) {
          if (foundProduct.quantity < product.amount) {
            return res.status(404).json({
              message: `The product only has ${foundProduct.quantity} left in stock`,
              status: 404,
            });
          }
          foundProduct.quantity -= product.amount;
          await foundProduct.save({ validateModifiedOnly: true });
        }

        if (foundProduct.status.includes("EXPIRE")) {
          return res.status(404).json({
            message: "The product is expired",
            status: 404,
          });
        }
      }

      await Order.create({
        orderProducts: detailOrderProducts,
        transferAddress: {
          fullName,
          address,
          phone,
        },
        paymentMethod,
        itemsPrice,
        transferPrice,
        totalPrice,
        userId,
      });

      return res.status(200).json({
        message: "Create order successfull",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = orderController;
