const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../models/order");

const orderController = {
  createOrder: async (req, res) => {
    try {
      const {
        orderProducts,
        user,
        paymentMethod,
        itemsPrice,
        transferPrice,
        totalPrice,
      } = req.body;
      const { fullName, address, phone } = req.body.transferAddress;

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

      const order = new Order({
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
        user: user,
      });

      const createdOrder = await order.save();
      res.status(200).json({
        message: "Create order successful",
        status: 200,
        createdOrder,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = orderController;
