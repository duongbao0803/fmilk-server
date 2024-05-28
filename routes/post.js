const authController = require("../controllers/authController");
const postController = require("../controllers/postController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get("/", postController.getAllPost);

router.get("/:id", postController.getDetailPost);

router.post(
  "/create",
  middlewareController.verifyAuthorityPermission,
  postController.addPost
);

router.put(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  postController.updatePost
);

router.delete(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  postController.deletePost
);

module.exports = router;
