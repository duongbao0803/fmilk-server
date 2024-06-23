const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../models/order");

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
      } = req.body;
      const { fullName, address, phone } = req.body.transferAddress;
      const { name, image, amount, price } = req.body.orderProducts;
      console.log(req.body.orderProducts);

      if (
        !fullName ||
        !address ||
        !phone ||
        !paymentMethod ||
        !itemsPrice ||
        !transferPrice ||
        !totalPrice
      ) {
        return res.status(400).json({
          message: "Input must be required",
          status: 400,
        });
      }

      if (!orderProducts || orderProducts.length === 0) {
        return res
          .status(400)
          .json({ message: "No order products", status: 400 });
      }

      if (!ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }

      const invalidProductId = [];
      for (let i = 0; i < orderProducts.length; i++) {
        const productId = orderProducts[i].productId;
        if (!ObjectId.isValid(productId)) {
          invalidProductId.push(productId);
        }
      }

      if (invalidProductId.length > 0) {
        return res.status(400).json({
          message: "Invalid product ID",
          status: 400,
        });
      }

      const order = Order.create({
        orderProducts,
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
        res.status(200).json({
          message: "Create order successful",
          status: 200,
          order,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = orderController;
