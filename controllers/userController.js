const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require("bcrypt");
const User = require("../models/user");

const userController = {
  getAllUser: async (req, res) => {
    try {
      let { page, pageSize, name, role } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0) {
        return res.status(400).json({
          message: "Page number must be a positive integer",
          status: 400,
        });
      }

      if (pageSize <= 0) {
        return res.status(400).json({
          message: "Page size must be a positive integer",
          status: 400,
        });
      }

      const skip = (page - 1) * pageSize;

      const filter = {};
      if (name) {
        filter.name = { $regex: name, $options: "i" };
      }
      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select("username name email phone address status role dob")
        .skip(skip)
        .limit(pageSize);
      const totalCount = await User.countDocuments(filter);

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Not found user",
          status: 404,
        });
      }

      return res.status(200).json({
        users,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalUsers: totalCount,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getUsersByRole: async (req, res) => {
    try {
      const role = req.query.role;
      if (!role) {
        return res
          .status(400)
          .json({ message: "Role is required", status: 400 });
      }

      const users = await User.find({ role });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
          message: "Not found user",
          status: 404,
        });
      }

      res.status(200).json({ userInfo });
    } catch (err) {
      res.status(400).json(err);
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

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          message: "Not found user",
          status: 404,
        });
      }

      if (user.status === false) {
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          message: "Delete Successful",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Cannot delete user before inactive",
          status: 400,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  updateUser: async (req, res) => {
    const id = req.params.id;
    const { name, phone, address, dob } = req.body;
    const myRole = req.user.role;
    const targetUser = await User.findById(id);
    const existingPhoneUser = await User.findOne({ phone });

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }

      if (!name || !phone || !address) {
        return res.status(400).json({
          message: "Name, phone and address must be required",
          status: 400,
        });
      }

      if (name.length < 8) {
        return res.status(400).json({
          message: "Name must be at least 8 characters",
          status: 400,
        });
      }

      if (existingPhoneUser && existingPhoneUser.id !== id) {
        return res.status(400).json({
          message: "Phone number is existed",
          status: 400,
        });
      }

      if (phone.length !== 10) {
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
          name,
          phone,
          address,
          dob,
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
      return res.status(400).json(err);
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
          message: "Not found user",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Update Status Successful",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  editInfoPersonal: async (req, res) => {
    const userId = req.user.id;
    const { name, phone, address, dob } = req.body;
    const existingPhoneUser = await User.findOne({ phone });

    try {
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({
          message: "Invalid user ID",
          status: 400,
        });
      }

      if (!name || !phone || !address || !dob) {
        return res.status(400).json({
          message: "Name, phone, dob and address must be required",
          status: 400,
        });
      }

      if (name.length < 8) {
        return res.status(400).json({
          message: "Name must be at least 8 characters",
          status: 400,
        });
      }

      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        return res.status(400).json({
          message: "Phone number is existed",
          status: 400,
        });
      }

      if (phone.length !== 10) {
        return res.status(400).json({
          message: "Phone number must be 10 digits",
          status: 400,
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          name,
          phone,
          address,
          dob,
        },
        { new: true }
      );
      if (user) {
        return res.status(200).json({
          message: "Update Successful",
          status: 200,
          user,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  changePassword: async (req, res) => {
    const userId = req.user.id;
    console.log("check userid", userId);
    const { oldPassword, newPassword } = req.body;

    try {
      const user = await User.findById(userId);
      console.log("check user", user);
      if (!user) {
        return res.status(404).json({
          message: "Not found user",
          status: 404,
        });
      }

      const comparePassword = await bcrypt.compare(oldPassword, user.password);

      if (!comparePassword) {
        return res.status(404).json({
          message: "Old password is invalid",
          status: 404,
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
          status: 400,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      user.password = hashed;
      await user.save();
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = userController;
