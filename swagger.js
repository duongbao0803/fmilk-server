const fs = require("fs");
const modelToSwagger = require("mongoose-to-swagger");
const swaggerAutogen = require("swagger-autogen")();
const User = require("./models/user.js");
const Product = require("./models/product.js");
const Post = require("./models/post.js");
const Order = require("./models/order.js");
const Brand = require("./models/brand.js");

const outputFile = "./swagger-output.json";
const routes = ["./routes/routes.js"];

const userDefinition = modelToSwagger(User);
const productDefinition = modelToSwagger(Product);
const postDefinition = modelToSwagger(Post);
const brandDefinition = modelToSwagger(Brand);
const orderDefinition = modelToSwagger(Order);

const doc = {
  info: {
    title: "FMilk Web API",
    description: "API Documentation for FMilk Web",
  },
  host: "fmilk-server.onrender.com",
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
    User: userDefinition,
    Product: productDefinition,
    Post: postDefinition,
    Brand: brandDefinition,
    Order: orderDefinition,
  },
};

if (fs.existsSync(outputFile)) {
  console.log("File exists. Updating existing Swagger file...");
  const existingSwaggerData = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

  existingSwaggerData.definitions.User = userDefinition;
  existingSwaggerData.definitions.Product = productDefinition;
  existingSwaggerData.definitions.Post = postDefinition;
  existingSwaggerData.definitions.Brand = brandDefinition;
  existingSwaggerData.definitions.Order = orderDefinition;

  fs.writeFileSync(outputFile, JSON.stringify(existingSwaggerData, null, 2));
  console.log("Swagger file updated successfully");
  require("./index.js");
} else {
  console.log("File does not exist. Creating new Swagger file...");
  swaggerAutogen(outputFile, routes, doc).then(() => {
    console.log("Swagger file generated successfully");
    require("./index.js");
  });
}
