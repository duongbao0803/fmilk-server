const brandController = require("../controllers/brandController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get("/", brandController.getAllBrand);
router.get("/:id", brandController.getDetailBrand);
router.post(
  "/create",
  middlewareController.verifyTokenAdmin,
  brandController.addNewBrand
);
router.delete(
  "/:id",
  middlewareController.verifyTokenAdmin,
  brandController.deleteBrand
);
router.put(
  "/:id",
  middlewareController.verifyTokenAdmin,
  brandController.updateBrand
);

module.exports = router;
