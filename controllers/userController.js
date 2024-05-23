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

      const users = await User.find()
        .select("username name email phone address status role dob")
        .skip(skip)
        .limit(pageSize);
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

  getDetailUser: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }
      const userInfo = await User.findById(req.params.id).select(
        "username name email phone address"
      );
      if (!userInfo) {
        return res.status(404).json({
          message: "User not found",
          status: 404,
        });
      }

      res.status(200).json({ userInfo });
    } catch (err) {
      res.status(500).json(err);
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
          message: "You cannot disable yourself",
          status: 403,
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          status: 404,
        });
      }

      if (user.status === false) {
        return res.status(404).json({
          message: "Account is already deleted",
          status: 404,
        });
      }

      user.status = false;
      await user.save();

      return res.status(200).json({
        message: "Delete Successful",
        status: 200,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  updateUser: async (req, res) => {
    const id = req.params.id;
    const newPhone = req.body.phone;
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newDob = req.body.dob;
    const myRole = req.user.role;
    const targetUser = await User.findById(id);
    const existingPhoneUser = await User.findOne({ phone: newPhone });

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

      if (existingPhoneUser && existingPhoneUser.id !== id) {
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

      if (
        (myRole === "MEMBER" && targetUser.role !== "MEMBER") ||
        (myRole === "STAFF" && targetUser.role !== "STAFF")
      ) {
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
          dob: newDob,
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

  updateStatusUser: async (req, res) => {
    const { status } = req.body;

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
          message: "You cannot disable yourself",
          status: 403,
        });
      }

      const userStatus = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!userStatus) {
        return res.status(404).json({
          message: "User not found",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Update Status Successful",
        status: 200,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  },
};

module.exports = userController;
