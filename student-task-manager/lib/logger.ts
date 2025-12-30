/**
 * Structured Logger Utility
 * 
 * Provides consistent, structured logging for the application.
 * Logs are formatted as JSON for easy parsing and integration with
 * monitoring tools like CloudWatch, Datadog, or ELK stack.
 * 
 * Usage:
 * import { logger } from "@/lib/logger";
 * logger.info("User logged in", { userId: 123 });
 * logger.error("Database connection failed", { error: err.message });
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogMetadata {
    [key: string]: any;
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    meta?: LogMetadata;
    timestamp: string;
    environment?: string;
}

/**
 * Formats and outputs a structured log entry
 * @param level - Log severity level
 * @param message - Human-readable log message
 * @param meta - Additional metadata for context
 */
const log = (level: LogLevel, message: string, meta?: LogMetadata): void => {
    const logEntry: LogEntry = {
        level,
        message,
        meta,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    };

    // In production, you might send this to a logging service
    // For now, we output to console with appropriate method
    const output = JSON.stringify(logEntry);

    switch (level) {
        case "error":
            console.error(output);
            break;
        case "warn":
            console.warn(output);
            break;
        case "debug":
            console.debug(output);
            break;
        case "info":
        default:
            console.log(output);
            break;
    }
};

/**
 * Logger instance with methods for different log levels
 */
export const logger = {
    /**
     * Log informational messages
     * @param message - Log message
     * @param meta - Additional context
     */
    info: (message: string, meta?: LogMetadata): void => {
        log("info", message, meta);
    },

    /**
     * Log warning messages
     * @param message - Log message
     * @param meta - Additional context
     */
    warn: (message: string, meta?: LogMetadata): void => {
        log("warn", message, meta);
    },

    /**
     * Log error messages
     * @param message - Log message
     * @param meta - Additional context
     */
    error: (message: string, meta?: LogMetadata): void => {
        log("error", message, meta);
    },

    /**
     * Log debug messages (useful in development)
     * @param message - Log message
     * @param meta - Additional context
     */
    debug: (message: string, meta?: LogMetadata): void => {
        log("debug", message, meta);
    },
};

/**
 * Example usage:
 * 
 * logger.info("User authentication successful", { userId: 123, email: "user@example.com" });
 * logger.error("Database query failed", { query: "SELECT * FROM users", error: err.message });
 * logger.warn("API rate limit approaching", { currentRequests: 95, limit: 100 });
 * logger.debug("Cache hit", { key: "user:123", ttl: 3600 });
 */
