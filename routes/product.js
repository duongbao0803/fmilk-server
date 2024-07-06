const productController = require("../controllers/productController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getDetailProduct);
router.post(
  "/create",
  middlewareController.verifyAuthorityPermission,
  productController.addProduct
);
router.delete(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  productController.deleteProduct
);
router.put(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  productController.updateProduct
);

router.post(
  "/:productId/comment",
  middlewareController.verifyTokenMember,
  productController.addNewComment
);

router.delete(
  "/:productId/comment/:commentId",
  middlewareController.verifyToken,
  productController.deleteComment
);

router.put(
  "/:productId/comment/:commentId",
  middlewareController.verifyToken,
  productController.editComment
);

module.exports = router;
