const jwt = require("jsonwebtoken");

const middlewareController = {
  verifyBearer: (req, res, next) => {
    const token = req.header("Authorization");
    if (token && !token.startsWith("Bearer ")) {
      req.headers.authorization = `Bearer ${token}`;
    }
    next();
  },

  verifyToken: (req, res, next) => {
    middlewareController.verifyBearer(req, res, () => {
      const token = req.headers["authorization"];
      if (token) {
        if (!token.startsWith("Bearer ")) {
          req.headers["authorization"] = `Bearer ${token}`;
        }
        const accessToken = token.split(" ")[1];
        jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, user) => {
          if (err) {
            return res.status(401).json({
              message: "Token không hợp lệ",
              status: 401,
            });
          }
          req.user = user;
          next();
        });
      } else {
        return res.status(401).json({
          message: "Bạn chưa đăng nhập",
          status: 401,
        });
      }
    });
  },

  verifyTokenAdmin: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.role === "ADMIN") {
        next();
      } else {
        res.status(403).json({
          message: "Bạn không có quyền",
          status: 403,
        });
      }
    });
  },

  verifyAuthorityPermission: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.role === "ADMIN" || req.user.role === "STAFF") {
        next();
      } else {
        res.status(403).json({
          message: "Bạn không có quyền",
          status: 403,
        });
      }
    });
  },

  verifyTokenCustomer: (req, res, next) => {
    if (!req.headers["authorization"]) {
      return next();
    }
    middlewareController.verifyToken(req, res, () => {
      if (req.user.role === "MEMBER") {
        next();
      } else {
        res.status(403).json({
          message: "Bạn không có quyền",
          status: 403,
        });
      }
    });
  },

  verifyTokenMember: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.role === "MEMBER") {
        next();
      } else {
        return res.status(403).json({
          message: "Bạn không có quyền",
          status: 403,
        });
      }
    });
  },
};

module.exports = middlewareController;
