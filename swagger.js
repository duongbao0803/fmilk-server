const User = require("./models/user.js");
const Product = require("./models/product.js");
const Post = require("./models/post.js");
const Order = require("./models/order.js");
const modelToSwagger = require("mongoose-to-swagger");

const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "FMilk Web API",
    description: "API Documentation for FMilk Web",
  },
  host: "https://fmilk-server.onrender.com",
  basePath: "/api/v1",
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "authorization",
      in: "header",
      description: "Please enter a valid token in the format: Bearer <token>",
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  definitions: {
    User: modelToSwagger(User),
    Product: modelToSwagger(Product),
    Post: modelToSwagger(Post),
    Order: modelToSwagger(Order),
  },
};

const outputFile = "./swagger-output.json";
const routes = ["./routes/routes.js"];

swaggerAutogen(outputFile, routes, doc).then(() => {
  require("./index.js");
});
