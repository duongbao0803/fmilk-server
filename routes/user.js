const userController = require("../controllers/userController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get(
  "/",
  middlewareController.verifyTokenAdmin,
  userController.getAllUser
);

router.get(
  "/:id",
  middlewareController.verifyToken,
  userController.getDetailUser
);

router.delete(
  "/:id",
  middlewareController.verifyTokenAdmin,
  userController.deleteUser
);

router.put("/:id", middlewareController.verifyToken, userController.updateUser);

router.patch(
  "/status/:id",
  middlewareController.verifyToken,
  userController.updateStatusUser
);

module.exports = router;
