const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

const orderController = {
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
            message: "User not found",
            status: 404,
          });
        }
        if (user) {
          if (user.role.includes("ADMIN") || user.role.includes("STAFF")) {
            return res.status(403).json({
              message: "Admin and Staff don't have permission to order",
              status: 403,
            });
          }
        }
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

      const order = await Order.create({
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

      if (order) {
        let isError = false;

        await Promise.all(
          detailOrderProducts.map(async (product) => {
            const foundProduct = await Product.findById(product.productId);
            if (foundProduct.status.includes("AVAILABLE")) {
              if (foundProduct.quantity < product.amount) {
                isError = true;
                return res.status(404).json({
                  message: `The product only has ${foundProduct.quantity} left in stock`,
                  status: 404,
                });
              } else {
                foundProduct.quantity -= product.amount;
                await foundProduct.save({ validateModifiedOnly: true });
              }
            } else {
              isError = true;
              return res.status(404).json({
                message: "The product is expired",
                status: 404,
              });
            }
          })
        );

        if (!isError) {
          return res.status(200).json({
            message: "Create order successful",
            status: 200,
          });
        }
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = orderController;
