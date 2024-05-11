const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");

dotenv.config();
const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// ROUTES
app.use("/v1/auth", authRoute);

app.listen(8000, () => {
  console.log("Server is running");
});
