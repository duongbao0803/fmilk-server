const User = require("../models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
dotenv.config();

let refreshTokens = [];
const authController = {
  getInfoUser: async (req, res) => {
    try {
      const user = req.user;
      const info = await User.findById(user.id).select(
        "_id username phone dob address email role"
      );
      res.json({ info });
    } catch (err) {
      res.status(400), json(err);
    }
  },

  registerUser: async (req, res) => {
    try {
      const { username, email, phone, password, name, role, address } =
        req.body;
      const existingUserByUsername = await User.findOne({
        username,
      });
      const existingUserByEmail = await User.findOne({ email });
      const existingUserByPhone = await User.findOne({ phone });

      if (existingUserByUsername) {
        return res.status(400).json({
          message: "Username is duplicated",
          status: 400,
        });
      }

      if (existingUserByPhone) {
        return res.status(400).json({
          message: "Phone number is duplicated",
          status: 400,
        });
      }

      if (existingUserByEmail) {
        return res.status(400).json({
          message: "Email is duplicated",
          status: 400,
        });
      }

      if (/[^a-z0-9]/.test(username)) {
        return res.status(400).json({
          message:
            "Username cannot contain special characters or uppercase letters",
          status: 400,
        });
      }

      if (phone.length !== 10) {
        return res.status(400).json({
          message: "Phone number must be 10 digits",
          status: 400,
        });
      }

      if (username.length < 8 || name.length < 8 || password.length < 8) {
        return res.status(400).json({
          message: "Username, name, and password must be at least 8 characters",
          status: 400,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        name,
        phone,
        email,
        role,
        address,
        password: hashed,
      });

      const user = await newUser.save();
      return res.status(200).json(user);
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  generateAccessToken: (user) => {
    const jti = uuid.v4();
    return jwt.sign(
      {
        jti: jti,
        id: user.id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2 days" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "10d" }
    );
  },

  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      console.log("check user", user);
      if (!user) {
        return res.status(404).json({
          message: "Username or password is invalid",
          status: 404,
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(404).json({
          message: "Username or password is invalid",
          status: 404,
        });
      }

      if (!user.status) {
        return res.status(403).json({
          message: "Account is not active",
          status: 403,
        });
      }

      if (user && validPassword) {
        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);
        refreshTokens.push(refreshToken);

        return res.status(200).json({
          message: "Login Successful",
          status: 200,
          accessToken,
          refreshToken,
        });
      }
    } catch (err) {
      console.log("400", err);
      return res.status(400).json(err);
    }
  },

  requestRefreshToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh Token is not valid",
        status: 401,
      });
    }

    if (!refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        message: "Refresh Token is not valid",
        status: 401,
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      if (err) {
        return res.status(401).json({
          message: "Refresh Token is not valid",
          status: 401,
        });
      }

      const newAccessToken = authController.generateAccessToken(user);
      return res.status(200).json({ accessToken: newAccessToken });
    });
  },
};

module.exports = authController;
