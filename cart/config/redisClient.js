// filename: config/redisClient.js
import { Redis } from '@upstash/redis';

// Check if the required environment variables are set
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Upstash Redis URL and Token must be defined in .env file');
}

// Create and export the Redis client instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;
