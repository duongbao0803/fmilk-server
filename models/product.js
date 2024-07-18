const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, require: true },
    content: { type: String, require: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true,
    },
  },
  { timestamps: true }
);

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
    comments: [commentSchema],
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
    expireDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "EXPIRE"],
      default: "AVAILABLE",
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      require: true,
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
