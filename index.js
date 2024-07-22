const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const routes = require("./routes/routes");
const cron = require("node-cron");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const Product = require("./models/product");
const connectDB = require("./config/database");

connectDB();
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const redis = require("redis");

// Create a Redis client
const client = redis.createClient();

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.log("Redis Client Error", err);
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

app.listen(6379, () => {
  console.log("Server is running");
});
