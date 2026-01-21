import redis from "./redis";
import { logger } from "./logger";

/**
 * Cache utility functions for common caching patterns
 */

export interface CacheOptions {
    ttl?: number; // Time-to-live in seconds (default: 60)
    prefix?: string; // Key prefix for namespacing
}

/**
 * Get data from cache
 * @param key - Cache key
 * @returns Parsed data or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        if (!data) {
            logger.debug("Cache miss", { key });
            return null;
        }
        logger.debug("Cache hit", { key });
        return JSON.parse(data) as T;
    } catch (error) {
        logger.error("Cache get error", { key, error });
        return null;
    }
}

/**
 * Set data in cache with TTL
 * @param key - Cache key
 * @param value - Data to cache
 * @param options - Cache options (TTL, prefix)
 */
export async function setCache<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
): Promise<void> {
    try {
        const { ttl = 60 } = options;
        const serialized = JSON.stringify(value);
        await redis.set(key, serialized, "EX", ttl);
        logger.debug("Cache set", { key, ttl });
    } catch (error) {
        logger.error("Cache set error", { key, error });
    }
}

/**
 * Delete data from cache
 * @param key - Cache key or pattern
 */
export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key);
        logger.debug("Cache deleted", { key });
    } catch (error) {
        logger.error("Cache delete error", { key, error });
    }
}

/**
 * Delete multiple cache keys matching a pattern
 * @param pattern - Redis key pattern (e.g., "users:*")
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            logger.debug("Cache pattern deleted", { pattern, count: keys.length });
        }
    } catch (error) {
        logger.error("Cache pattern delete error", { pattern, error });
    }
}

/**
 * Cache-aside pattern: Get from cache or execute function and cache result
 * @param key - Cache key
 * @param fetchFn - Function to execute if cache miss
 * @param options - Cache options
 * @returns Data from cache or fetch function
 */
export async function cacheAside<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    // Try to get from cache
    const cached = await getCache<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Cache miss - fetch data
    logger.debug("Cache miss - fetching data", { key });
    const data = await fetchFn();

    // Store in cache
    await setCache(key, data, options);

    return data;
}

/**
 * Check if cache is available
 */
export async function isCacheAvailable(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        logger.error("Redis ping failed", { error });
        return false;
    }
}

/**
 * Generate cache key with prefix
 * @param prefix - Key prefix
 * @param parts - Key parts to join
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(":")}`;
}
