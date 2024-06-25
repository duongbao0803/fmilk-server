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
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    origin: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
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
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
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
