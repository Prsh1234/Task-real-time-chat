import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL 
});
// "redis://localhost:6379"
redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
};

export default redisClient;