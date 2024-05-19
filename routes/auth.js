const authController = require("../controllers/authController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get(
  "/infoUser",
  middlewareController.verifyToken,
  authController.getInfoUser
);
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh", authController.requestRefreshToken);

module.exports = router;
