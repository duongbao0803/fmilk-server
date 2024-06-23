const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderProducts: [
      {
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    transferAddress: {
      fullName: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    itemsPrice: {
      type: Number,
      required: true,
    },
    transferPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
