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

module.exports = router;
