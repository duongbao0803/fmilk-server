const orderController = require("../controllers/orderController");
const middlewareController = require("../middleware/verifyToken");
const router = require("express").Router();

router.get("/vnpay_return", orderController.returnVnpay);

router.get(
  "/getByUser",
  middlewareController.verifyTokenMember,
  orderController.getOrderListByUserId
);

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

router.put(
  "/:orderId/status",
  middlewareController.verifyAuthorityPermission,
  orderController.updateStatusOrder
);

module.exports = router;
