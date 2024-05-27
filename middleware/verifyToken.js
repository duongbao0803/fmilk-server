const jwt = require("jsonwebtoken");

const middlewareController = {
  verifyToken: (req, res, next) => {
    const token = req.headers["authorization"];
    if (token) {
      const accesstoken = token.split(" ")[1];
      jwt.verify(accesstoken, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) {
          console.log("check err", err);
          return res.status(403).json({
            message: "Token is not valid",
            status: 403,
            errorType: "invalid_token",
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
};

module.exports = middlewareController;
