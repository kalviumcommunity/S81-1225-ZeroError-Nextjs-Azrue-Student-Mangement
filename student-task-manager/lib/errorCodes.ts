/**
 * Centralized Error Code Dictionary
 * 
 * This file maintains a consistent set of error codes used across the application.
 * Each error code is mapped to a unique identifier for easier tracking, debugging,
 * and monitoring in production environments.
 * 
 * Usage:
 * import { ERROR_CODES } from "@/lib/errorCodes";
 * return sendError("Invalid input", ERROR_CODES.VALIDATION_ERROR, 400);
 */

export const ERROR_CODES = {
    // Validation Errors (E001-E099)
    VALIDATION_ERROR: "E001",
    MISSING_REQUIRED_FIELD: "E002",
    INVALID_FORMAT: "E003",
    INVALID_PARAMETER: "E004",

    // Authentication & Authorization Errors (E100-E199)
    UNAUTHORIZED: "E100",
    FORBIDDEN: "E101",
    INVALID_TOKEN: "E102",
    TOKEN_EXPIRED: "E103",
    INVALID_CREDENTIALS: "E104",
    TOKEN_REVOKED: "E105",

    // Resource Errors (E200-E299)
    NOT_FOUND: "E200",
    RESOURCE_NOT_FOUND: "E201",
    USER_NOT_FOUND: "E202",
    PROJECT_NOT_FOUND: "E203",
    TASK_NOT_FOUND: "E204",

    // Database Errors (E300-E399)
    DATABASE_ERROR: "E300",
    DATABASE_UNREACHABLE: "E301",
    DUPLICATE_ENTRY: "E302",
    FOREIGN_KEY_VIOLATION: "E303",
    DATABASE_CONNECTION_FAILED: "E304",

    // Business Logic Errors (E400-E499)
    OPERATION_FAILED: "E400",
    TASK_CREATION_FAILED: "E401",
    PROJECT_CREATION_FAILED: "E402",
    USER_CREATION_FAILED: "E403",
    UPDATE_FAILED: "E404",
    DELETE_FAILED: "E405",

    // Server Errors (E500-E599)
    INTERNAL_ERROR: "E500",
    SERVICE_UNAVAILABLE: "E501",
    TIMEOUT: "E502",
    EXTERNAL_API_ERROR: "E503",
} as const;

/**
 * Type for error codes - ensures type safety when using error codes
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error code descriptions for documentation and logging
 */
export const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
    // Validation Errors
    E001: "Validation error - Input data does not meet requirements",
    E002: "Missing required field - One or more required fields are missing",
    E003: "Invalid format - Data format is incorrect",
    E004: "Invalid parameter - Query or path parameter is invalid",

    // Authentication & Authorization Errors
    E100: "Unauthorized - Authentication required",
    E101: "Forbidden - Insufficient permissions",
    E102: "Invalid token - Authentication token is invalid",
    E103: "Token expired - Authentication token has expired",
    E104: "Invalid credentials - Username or password is incorrect",
    E105: "Token revoked - Refresh token has been revoked",

    // Resource Errors
    E200: "Not found - Requested resource does not exist",
    E201: "Resource not found - Generic resource not found",
    E202: "User not found - Specified user does not exist",
    E203: "Project not found - Specified project does not exist",
    E204: "Task not found - Specified task does not exist",

    // Database Errors
    E300: "Database error - Generic database operation failed",
    E301: "Database unreachable - Cannot connect to database",
    E302: "Duplicate entry - Record with unique field already exists",
    E303: "Foreign key violation - Referenced record does not exist",
    E304: "Database connection failed - Unable to establish connection",

    // Business Logic Errors
    E400: "Operation failed - Business operation could not be completed",
    E401: "Task creation failed - Unable to create task",
    E402: "Project creation failed - Unable to create project",
    E403: "User creation failed - Unable to create user",
    E404: "Update failed - Unable to update record",
    E405: "Delete failed - Unable to delete record",

    // Server Errors
    E500: "Internal error - Unexpected server error occurred",
    E501: "Service unavailable - Service is temporarily unavailable",
    E502: "Timeout - Request timed out",
    E503: "External API error - Third-party service error",
};

/**
 * Helper function to get error description by code
 * @param code - Error code
 * @returns Error description
 */
export const getErrorDescription = (code: ErrorCode): string => {
    return ERROR_DESCRIPTIONS[code] || "Unknown error";
};
