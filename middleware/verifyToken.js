const jwt = require("jsonwebtoken");

const middlewareController = {
  verifyToken: (req, res, next) => {
    const token = req.headers.token;
    if (token) {
      const accesstoken = token.split(" ")[1];
      jwt.verify(accesstoken, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) {
          return res.status(403).json({
            message: "Token is not valid",
            status: 403,
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
      if (req.user.id === req.params.id || req.user.admin) {
        next();
      } else {
        res.status(403).json({
          message: "You do not allow to use this func",
          status: 403,
        });
      }
    });
  },
};

module.exports = middlewareController;
