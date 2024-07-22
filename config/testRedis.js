const redis = require("redis");

const REDIS_HOST = "your-redis-cloud-host";
const REDIS_PORT = "your-redis-cloud-port";
const REDIS_PASSWORD = "your-redis-cloud-password";

const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
  },
});

client.on("connect", () => {
  console.log("Connected to Redis Cloud");
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

async function testRedis() {
  try {
    await client.set("testKey", "Hello, Redis Cloud!");

    const value = await client.get("testKey");
    console.log("Value:", value);

    await client.quit();
  } catch (error) {
    console.error("Error:", error);
  }
}

testRedis();
