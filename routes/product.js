const productController = require("../controllers/productController");

const router = require("express").Router();

// router.get("/", authController.getInfoUser);
router.get("/", productController.getAllProduct);
router.get("/:id", productController.getDetailProduct);
router.post("/create", productController.addProduct);
router.delete("/:id", productController.deleteProduct);
router.put("/:id", productController.updateProduct);

module.exports = router;
