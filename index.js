const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const routes = require("./routes/routes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const connectDB = require("./config/database");
const scheduleCron = require("./config/node-cron");

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

connectDB();
scheduleCron();

app.use("/api/v1", routes);

app.listen(8000, () => {
  console.log("Server is running");
});
