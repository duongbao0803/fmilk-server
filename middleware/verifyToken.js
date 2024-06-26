const jwt = require("jsonwebtoken");

const middlewareController = {
  verifyBearer: (req, res, next) => {
    const token = req.header("Authorization");
    console.log("check beaerer", token);
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
              message: "Token is not valid",
              status: 401,
            });
          }
          req.user = user;
          next();
        });
      } else {
        return res.status(401).json({
          message: "You are unauthorized",
          status: 401,
        });
      }
    });
  },

  verifyTokenAdmin: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.id === req.params.id || req.user.role === "ADMIN") {
        next();
      } else {
        res.status(403).json({
          message: "You don't have permission",
          status: 403,
        });
      }
    });
  },

  verifyAuthorityPermission: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (
        req.user.id === req.params.id ||
        req.user.role === "ADMIN" ||
        req.user.role === "STAFF"
      ) {
        next();
      } else {
        res.status(403).json({
          message: "You don't have permission",
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
          message: "You don't have permission",
          status: 403,
        });
      }
    });
  },
};

module.exports = middlewareController;
