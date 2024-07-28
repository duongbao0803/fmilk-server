const cron = require("node-cron");
const Product = require("../models/product");

const scheduleCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const products = await Product.find({
        expireDate: { $lt: new Date() },
        status: "AVAILABLE",
      });

      if (products.length > 0) {
        const bulkOps = products.map((product) => ({
          updateOne: {
            filter: { _id: product._id },
            update: { status: "EXPIRE" },
          },
        }));

        await Product.bulkWrite(bulkOps);
        console.log("Update product success");
      } else {
        console.log("Not found product");
      }
    } catch (error) {
      console.error("Error updating product", error);
    }
  });
};

module.exports = scheduleCronJobs;
