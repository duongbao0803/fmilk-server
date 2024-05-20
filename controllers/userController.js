const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const User = require("../models/user");

const userController = {
  getAllUser: async (req, res) => {
    try {
      let { page, pageSize } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const users = await User.find().skip(skip).limit(pageSize);
      const totalCount = await User.countDocuments();

      return res.status(200).json({
        users,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalUsers: totalCount,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  deleteUser: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }

      const loggedInUserId = req.user.id;
      if (req.params.id === loggedInUserId.toString()) {
        return res.status(403).json({
          message: "You cannot delete yourself",
          status: 403,
        });
      }

      const user = await User.findByIdAndUpdate(req.params.id, {
        status: false,
      });
      if (user) {
        return res.status(200).json(
          {
            message: "Delete Successful",
            status: 200,
          },
          { new: true }
        );
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  updateUser: async (req, res) => {
    const id = req.params.id;
    const newPhone = req.body.phone;
    const newName = req.body.name;
    const newAddress = req.body.address;
    const myRole = req.user.role;
    const targetUser = await User.findById(id);
    const existingPhone = await User.findOne({ phone: newPhone });

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }

      if (!newName || !newPhone || !newAddress) {
        return res.status(400).json({
          message: "Name, phone and address must be required",
          status: 400,
        });
      }

      if (newName.length < 8) {
        return res.status(400).json({
          message: "Name must be at least 8 characters long",
          status: 400,
        });
      }

      if (existingPhone) {
        return res.status(400).json({
          message: "Phone number is existed",
          status: 400,
        });
      }

      if (newPhone.length !== 10) {
        return res.status(400).json({
          message: "Phone number must be 10 digits",
          status: 400,
        });
      }

      if (myRole === "MEMBER" && targetUser.role !== "MEMBER") {
        return res.status(403).json({
          message: "You don't have permission",
          status: 403,
        });
      }

      if (myRole === "STAFF" && targetUser.role !== "STAFF") {
        return res.status(403).json({
          message: "You don't have permission",
          status: 403,
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        {
          name: newName,
          phone: newPhone,
          address: newAddress,
        },
        { new: true }
      );
      if (user) {
        return res.status(200).json({
          message: "Update Successful",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Update failed",
          status: 400,
        });
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  },
};

module.exports = userController;
