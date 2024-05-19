const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 30,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      minlength: 8,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    status: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "USER",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
