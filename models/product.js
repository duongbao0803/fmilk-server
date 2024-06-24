const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    typeOfProduct: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    rating: {
      type: Number,
      required: true,
    },
    expireDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "EXPIRE"],
      default: "AVAILABLE",
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.expireDate < new Date()) {
    this.status = "EXPIRE";
  }
  next();
});

module.exports = mongoose.model("product", productSchema);
