import { NextResponse } from "next/server";

/**
 * Global API Response Handler
 * 
 * This module provides a unified response format for all API endpoints,
 * ensuring consistency, predictability, and improved developer experience.
 * 
 * Response Envelope Structure:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   error?: { code: string, details?: any },
 *   timestamp: string
 * }
 */

/**
 * Sends a successful API response
 * 
 * @param data - The payload to return (can be any type)
 * @param message - Success message describing the operation
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized success format
 * 
 * @example
 * return sendSuccess({ id: 1, name: "John" }, "User fetched successfully");
 */
export const sendSuccess = (
    data: any,
    message = "Success",
    status = 200
) => {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
};

/**
 * Sends an error API response
 * 
 * @param message - User-friendly error message
 * @param code - Error code for tracking and debugging
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details (optional)
 * @returns NextResponse with standardized error format
 * 
 * @example
 * return sendError("User not found", "USER_NOT_FOUND", 404);
 * return sendError("Validation failed", "VALIDATION_ERROR", 400, { field: "email" });
 */
export const sendError = (
    message = "Something went wrong",
    code = "INTERNAL_ERROR",
    status = 500,
    details?: any
) => {
    return NextResponse.json(
        {
            success: false,
            message,
            error: {
                code,
                ...(details && { details }),
            },
            timestamp: new Date().toISOString(),
        },
        { status }
    );
};

/**
 * Sends a paginated success response
 * 
 * @param items - Array of items for the current page
 * @param total - Total count of items across all pages
 * @param page - Current page number
 * @param limit - Items per page
 * @param message - Success message
 * @returns NextResponse with standardized paginated format
 * 
 * @example
 * return sendPaginatedSuccess(users, 100, 1, 10, "Users fetched successfully");
 */
export const sendPaginatedSuccess = (
    items: any[],
    total: number,
    page: number,
    limit: number,
    message = "Data fetched successfully"
) => {
    return NextResponse.json(
        {
            success: true,
            message,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPreviousPage: page > 1,
                },
            },
            timestamp: new Date().toISOString(),
        },
        { status: 200 }
    );
};

/**
 * Helper function to handle Prisma-specific errors
 * 
 * @param error - The caught error object
 * @returns Object with message, code, and status
 */
export const handlePrismaError = (error: any) => {
    // Database unreachable
    if (error?.code === "P1001") {
        return {
            message: "Database is unreachable. Please ensure PostgreSQL is running and migrations are applied.",
            code: "DATABASE_UNREACHABLE",
            status: 503,
        };
    }

    // Unique constraint violation
    if (error?.code === "P2002") {
        const field = error?.meta?.target?.[0] || "field";
        return {
            message: `A record with this ${field} already exists.`,
            code: "DUPLICATE_ENTRY",
            status: 400,
        };
    }

    // Foreign key constraint violation
    if (error?.code === "P2003") {
        return {
            message: "Referenced record does not exist.",
            code: "FOREIGN_KEY_VIOLATION",
            status: 400,
        };
    }

    // Record not found
    if (error?.code === "P2025") {
        return {
            message: "Record not found.",
            code: "NOT_FOUND",
            status: 404,
        };
    }

    // Default error
    return {
        message: error?.message || "An unexpected error occurred.",
        code: "INTERNAL_ERROR",
        status: 500,
    };
};
