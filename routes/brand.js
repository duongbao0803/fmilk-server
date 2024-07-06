const brandController = require("../controllers/brandController");
const middlewareController = require("../middleware/verifyToken");

const router = require("express").Router();

router.get("/", brandController.getAllBrand);
router.get(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  brandController.getDetailBrand
);
router.post(
  "/create",
  middlewareController.verifyAuthorityPermission,
  brandController.addNewBrand
);
router.delete(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  brandController.deleteBrand
);
router.put(
  "/:id",
  middlewareController.verifyAuthorityPermission,
  brandController.updateBrand
);

module.exports = router;
