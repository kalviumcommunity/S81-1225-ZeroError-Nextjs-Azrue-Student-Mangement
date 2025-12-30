import Redis from "ioredis";
import { logger } from "./logger";

/**
 * Redis client singleton for caching
 * Supports both local Redis and Redis Cloud connections
 */
class RedisClient {
    private static instance: Redis | null = null;
    private static isConnected = false;

    /**
     * Get or create Redis client instance
     */
    static getInstance(): Redis {
        if (!this.instance) {
            const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

            this.instance = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                reconnectOnError(err) {
                    const targetError = "READONLY";
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                },
            });

            // Connection event handlers
            this.instance.on("connect", () => {
                this.isConnected = true;
                logger.info("Redis client connected successfully");
            });

            this.instance.on("error", (error) => {
                this.isConnected = false;
                logger.error("Redis connection error", { error: error.message });
            });

            this.instance.on("close", () => {
                this.isConnected = false;
                logger.warn("Redis connection closed");
            });
        }

        return this.instance;
    }

    /**
     * Check if Redis is connected
     */
    static isReady(): boolean {
        return this.isConnected;
    }

    /**
     * Gracefully disconnect Redis
     */
    static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
            this.isConnected = false;
            logger.info("Redis client disconnected");
        }
    }
}

// Export singleton instance
const redis = RedisClient.getInstance();

export default redis;
export { RedisClient };
