const userController = require("../controllers/userController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get(
  "/",
  middlewareController.verifyTokenAdmin,
  userController.getAllUser
);
router.delete(
  "/:id",
  middlewareController.verifyTokenAdmin,
  userController.deleteUser
);

router.put("/:id", middlewareController.verifyToken, userController.updateUser);

module.exports = router;
