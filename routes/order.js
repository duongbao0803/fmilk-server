const orderController = require("../controllers/orderController");
const middlewareController = require("../middleware/verifyToken");
const router = require("express").Router();

router.post(
  "/create",
  middlewareController.verifyTokenCustomer,
  orderController.createOrder
);

module.exports = router;
