const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const routes = require("./routes/routes");
const cron = require("node-cron");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const Product = require("./models/product");

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

//Node-cron
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
      console.log("No products to update");
    }
  } catch (error) {
    console.error("Error updating product", error);
  }
});

// ROUTES
app.use("/api/v1", routes);

app.listen(8000, () => {
  console.log("Server is running");
});
