const { promisify } = require("util");
const redis = require("redis");
const dotenv = require("dotenv");
dotenv.config();

const redisClient = redis.createClient({
  url: "redis://red-cqj4k4qj1k6c739mljog:6379",
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setexAsync = promisify(redisClient.setex).bind(redisClient);

redisClient.on("connect", () => {
  console.log("Connected to redis");
});

redisClient.on("error", (err) => {
  console.error("Err", err);
});

module.exports = { redisClient, getAsync, setexAsync };
