const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    feedback: {
      type: String,
    },
    rating: {
      type: Number,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("comment", commentSchema);
