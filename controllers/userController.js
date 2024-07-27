const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { getAsync, setexAsync } = require("../config/redis");

const userController = {
  getAllUser: async (req, res) => {
    try {
      let { page, pageSize, name, role } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0 || pageSize <= 0) {
        return res.status(400).json({
          message: "Số lượng trang và phần tử phải là số dương",
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

      const key = `users:page:${page}:size:${pageSize}:name:${
        name || ""
      }:role:${role || ""}`;

      try {
        const cachedData = await getAsync(key);

        if (cachedData) {
          return res.status(200).json(JSON.parse(cachedData));
        }

        const users = await User.find(filter)
          .select("username name email phone address status role dob")
          .skip(skip)
          .limit(pageSize);
        const totalCount = await User.countDocuments(filter);

        if (skip >= totalCount) {
          return res.status(404).json({
            message: "Không tìm thấy người dùng",
            status: 404,
          });
        }

        const result = {
          users,
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          totalUsers: totalCount,
        };

        await setexAsync(key, 1500, JSON.stringify(result));

        return res.status(200).json(result);
      } catch (err) {
        return res.status(400).json(err);
      }
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
          .json({ message: "Vai trò là trường bắt buộc", status: 400 });
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
          message: "ID của người dùng không hợp lệ",
          status: 400,
        });
      }
      const userInfo = await User.findById(req.params.id).select(
        "username name email phone address"
      );
      if (!userInfo) {
        return res.status(404).json({
          message: "Không tìm thấy người dùng",
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
          message: "ID của người dùng không hợp lệ",
          status: 400,
        });
      }

      const loggedInUserId = req.user.id;
      if (req.params.id === loggedInUserId.toString()) {
        return res.status(403).json({
          message: "Bạn không thể xóa bản thân bạn",
          status: 403,
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          message: "Không tìm thấy người dùng",
          status: 404,
        });
      }

      if (user.status === false) {
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          message: "Xóa thành công",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Không thể xóa người dùng trước khi người dùng INACTIVE",
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
    const date = new Date();
    const targetUser = await User.findById(id);
    const existingPhoneUser = await User.findOne({ phone });

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "ID của người dùng không hợp lệ",
          status: 400,
        });
      }

      if (!name || !phone || !address) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      if (name.length < 8) {
        return res.status(400).json({
          message: "Tên người dùng có ít nhất 8 ký tự",
          status: 400,
        });
      }

      if (existingPhoneUser && existingPhoneUser.id !== id) {
        return res.status(400).json({
          message: "Số điện thoại đã tồn tại",
          status: 400,
        });
      }

      if (phone.length !== 10) {
        return res.status(400).json({
          message: "Số điện thoại phải có 10 số",
          status: 400,
        });
      }

      const dobDate = new Date(dob);

      if (dobDate >= date) {
        return res.status(400).json({
          message: "Date of birth must be in the past",
          status: 400,
        });
      }

      if (
        (myRole === "MEMBER" && targetUser.role !== "MEMBER") ||
        (myRole === "STAFF" && targetUser.role !== "STAFF")
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền",
          status: 403,
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        {
          name,
          phone,
          address,
          dob: dobDate,
        },
        { new: true }
      );
      if (user) {
        return res.status(200).json({
          message: "Cập nhật thành công",
          status: 200,
        });
      } else {
        return res.status(400).json({
          message: "Cập nhật thất bại",
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
          message: "ID của người dùng không hợp lệ",
          status: 400,
        });
      }

      const loggedInUserId = req.user.id;
      if (req.params.id === loggedInUserId.toString()) {
        return res.status(403).json({
          message: "Bạn không thể vô hiệu hóa chính bản thân bạn",
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
          message: "Không tìm thấy người dùng",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Cập nhật trạng thái thành công",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  editInfoPersonal: async (req, res) => {
    const userId = req.user.id;
    const { name, phone, address, dob } = req.body;
    const date = new Date();
    const existingPhoneUser = await User.findOne({ phone });

    try {
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({
          message: "ID của người dùng không hợp lệ",
          status: 400,
        });
      }

      if (!name || !phone || !address || !dob) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      if (name.length < 8) {
        return res.status(400).json({
          message: "Tên người dùng có ít nhất 8 ký tự",
          status: 400,
        });
      }

      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        return res.status(400).json({
          message: "Số điện thoại đã tồn tại",
          status: 400,
        });
      }

      if (phone.length !== 10) {
        return res.status(400).json({
          message: "Số điện thoại phải có 10 số",
          status: 400,
        });
      }

      const dobDate = new Date(dob);

      if (dobDate >= date) {
        return res.status(400).json({
          message: "Date of birth must be in the past",
          status: 400,
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          name,
          phone,
          address,
          dob: dobDate,
        },
        { new: true }
      );
      if (user) {
        return res.status(200).json({
          message: "Cập nhật thành công",
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
    const { oldPassword, newPassword } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "Không tìm thấy người dùng",
          status: 404,
        });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      const comparePassword = await bcrypt.compare(oldPassword, user.password);

      if (!comparePassword) {
        return res.status(404).json({
          message: "Mật khẩu cũ không hợp lệ",
          status: 404,
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "Mật khẩu phải có ít nhất 8 ký tự",
          status: 400,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      user.password = hashed;
      const updateUser = await user.save();
      if (updateUser) {
        return res.status(200).json({
          message: "Thay đổi mật khẩu thành công",
          status: 200,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = userController;
