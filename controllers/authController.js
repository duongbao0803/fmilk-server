const User = require("../models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

let refreshTokens = [];
const authController = {
  getInfoUser: async (req, res) => {
    try {
      const user = req.user;
      const info = await User.findById(user.id).select("username email role");
      res.json({ info });
    } catch (err) {
      console.log("check err", err);
      res.status(500), json(err);
    }
  },

  registerUser: async (req, res) => {
    try {
      const existingUserByUsername = await User.findOne({
        username: req.body.username,
      });
      const existingUserByEmail = await User.findOne({ email: req.body.email });

      if (existingUserByUsername) {
        return res.status(400).json({
          message: "Username is duplicated",
          status: 400,
        });
      }

      if (existingUserByEmail) {
        return res.status(400).json({
          message: "Email is duplicated",
          status: 400,
        });
      }

      if (/[^a-z0-9]/.test(req.body.username)) {
        return res.status(400).json({
          message:
            "Username cannot contain special characters or uppercase letters",
          status: 400,
        });
      }

      if (
        req.body.username.length < 8 ||
        req.body.name.length < 8 ||
        req.body.password.length < 8
      ) {
        return res.status(400).json({
          message:
            "Username, name, and password must be at least 8 characters long",
          status: 400,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(req.body.password, salt);

      const newUser = new User({
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        password: hashed,
      });

      const user = await newUser.save();
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "7d" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "20d" }
    );
  },

  loginUser: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user) {
        return res.status(404).json({
          message: "Username or password is invalid",
          status: 404,
        });
      }

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      console.log("check validPassword", validPassword);

      if (!validPassword) {
        return res.status(404).json({
          message: "Username or password is invalid",
          status: 404,
        });
      }

      if (user && validPassword) {
        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });
        return res.status(200).json({
          message: "Login Successful",
          status: 200,
          accessToken,
        });
      }
    } catch (err) {
      console.log("500", err);
      return res.status(500).json(err);
    }
  },

  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh Token is not valid",
        status: 401,
      });
    }
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json({
        message: "Refresh Token is not valid",
        status: 403,
      });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });
      return res.status(200).json({ accessToken: newAccessToken });
    });
  },
};

module.exports = authController;
