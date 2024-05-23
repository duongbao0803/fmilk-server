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
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    dob: {
      type: Date,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
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
      default: "MEMBER",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
