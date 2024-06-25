const orderController = require("../controllers/orderController");
const middlewareController = require("../middleware/verifyToken");
const router = require("express").Router();

router.get(
  "/",
  middlewareController.verifyTokenAdmin,
  orderController.getAllOrder
);

router.get(
  "/:id",
  middlewareController.verifyTokenAdmin,
  orderController.getDetailOrder
);

router.post(
  "/create",
  middlewareController.verifyTokenCustomer,
  orderController.createOrder
);

module.exports = router;
