import { Redis } from "@upstash/redis"
import { env } from "./config"

let redisClient: Redis | null = null

async function getRedisClient() {
  if (redisClient) {
    return redisClient
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      "⚠️ Redis credentials not configured. Redis caching will be disabled."
    )
    return null
  }

  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Test connection
    await redisClient.ping()
    return redisClient
  } catch (error) {
    console.error("❌ Redis connection error:", error)
    redisClient = null
    return null
  }
}

export { getRedisClient, redisClient as redis }
