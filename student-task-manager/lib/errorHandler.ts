import { NextResponse } from "next/server";
import { logger } from "./logger";
import { ERROR_CODES, ErrorCode } from "./errorCodes";
import { ZodError } from "zod";

/**
 * Centralized Error Handler
 * 
 * This module provides a unified error handling strategy that:
 * - Categorizes errors by type (Validation, Database, Auth, etc.)
 * - Logs detailed error information for developers
 * - Returns safe, user-friendly messages in production
 * - Redacts sensitive information (stack traces) in production
 * 
 * Usage:
 * import { handleError } from "@/lib/errorHandler";
 * 
 * try {
 *   // Your code
 * } catch (error) {
 *   return handleError(error, "GET /api/users");
 * }
 */

export interface ErrorContext {
    route?: string;
    userId?: string;
    requestId?: string;
    [key: string]: any;
}

/**
 * Determines if the application is running in production mode
 */
const isProduction = (): boolean => {
    return process.env.NODE_ENV === "production";
};

/**
 * Categorizes and handles different types of errors
 * @param error - The caught error object
 * @param context - Context information (route, user, etc.)
 * @returns NextResponse with appropriate error format
 */
export function handleError(
    error: any,
    context: string | ErrorContext
): NextResponse {
    const isProd = isProduction();
    const contextStr = typeof context === "string" ? context : context.route || "Unknown route";
    const contextMeta = typeof context === "object" ? context : { route: context };

    // Default error response
    let errorResponse: {
        success: boolean;
        message: string;
        error: {
            code: string;
            [key: string]: any;
        };
        timestamp: string;
    } = {
        success: false,
        message: isProd
            ? "Something went wrong. Please try again later."
            : error?.message || "Unknown error",
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
        },
        timestamp: new Date().toISOString(),
    };

    let statusCode = 500;

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        statusCode = 400;
        errorResponse = {
            success: false,
            message: "Validation failed",
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                ...(isProd ? {} : {
                    details: error.issues.map((e: any) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                }),
            },
            timestamp: new Date().toISOString(),
        };

        logger.error(`Validation error in ${contextStr}`, {
            ...contextMeta,
            validationErrors: error.issues,
            stack: isProd ? "REDACTED" : error.stack,
        });

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Handle Prisma errors
    if (error?.code?.startsWith("P")) {
        const prismaError = handlePrismaError(error);
        statusCode = prismaError.status;
        errorResponse = {
            success: false,
            message: prismaError.message,
            error: {
                code: prismaError.code,
                ...(isProd ? {} : { prismaCode: error.code }),
            },
            timestamp: new Date().toISOString(),
        };

        logger.error(`Database error in ${contextStr}`, {
            ...contextMeta,
            prismaCode: error.code,
            message: error.message,
            meta: error.meta,
            stack: isProd ? "REDACTED" : error.stack,
        });

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Handle custom application errors (with errorCode property)
    if (error?.errorCode) {
        statusCode = error.statusCode || 500;
        errorResponse = {
            success: false,
            message: isProd ? "An error occurred" : error.message,
            error: {
                code: error.errorCode,
            },
            timestamp: new Date().toISOString(),
        };

        logger.error(`Application error in ${contextStr}`, {
            ...contextMeta,
            errorCode: error.errorCode,
            message: error.message,
            stack: isProd ? "REDACTED" : error.stack,
        });

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Handle generic errors
    logger.error(`Unhandled error in ${contextStr}`, {
        ...contextMeta,
        message: error?.message || "Unknown error",
        name: error?.name,
        stack: isProd ? "REDACTED" : error?.stack,
    });

    // In development, include stack trace
    if (!isProd && error?.stack) {
        errorResponse = {
            ...errorResponse,
            error: {
                ...errorResponse.error,
                stack: error.stack,
            },
        } as any;
    }

    return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handles Prisma-specific errors and maps them to application error codes
 * @param error - Prisma error object
 * @returns Object with message, code, and status
 */
function handlePrismaError(error: any): {
    message: string;
    code: ErrorCode;
    status: number;
} {
    // Database unreachable
    if (error?.code === "P1001") {
        return {
            message: "Database is unreachable. Please try again later.",
            code: ERROR_CODES.DATABASE_UNREACHABLE,
            status: 503,
        };
    }

    // Unique constraint violation
    if (error?.code === "P2002") {
        const field = error?.meta?.target?.[0] || "field";
        return {
            message: `A record with this ${field} already exists.`,
            code: ERROR_CODES.DUPLICATE_ENTRY,
            status: 400,
        };
    }

    // Foreign key constraint violation
    if (error?.code === "P2003") {
        return {
            message: "Referenced record does not exist.",
            code: ERROR_CODES.FOREIGN_KEY_VIOLATION,
            status: 400,
        };
    }

    // Record not found
    if (error?.code === "P2025") {
        return {
            message: "Record not found.",
            code: ERROR_CODES.NOT_FOUND,
            status: 404,
        };
    }

    // Database connection failed
    if (error?.code === "P1002" || error?.code === "P1003") {
        return {
            message: "Database connection failed.",
            code: ERROR_CODES.DATABASE_CONNECTION_FAILED,
            status: 503,
        };
    }

    // Default database error
    return {
        message: "A database error occurred.",
        code: ERROR_CODES.DATABASE_ERROR,
        status: 500,
    };
}

/**
 * Custom error class for application-specific errors
 * 
 * Usage:
 * throw new AppError("User not authorized", ERROR_CODES.FORBIDDEN, 403);
 */
export class AppError extends Error {
    errorCode: ErrorCode;
    statusCode: number;

    constructor(message: string, errorCode: ErrorCode, statusCode: number = 500) {
        super(message);
        this.name = "AppError";
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Example usage:
 * 
 * // In an API route:
 * export async function GET(req: NextRequest) {
 *   try {
 *     // Simulate database failure
 *     throw new Error("Database connection failed!");
 *   } catch (error) {
 *     return handleError(error, "GET /api/users");
 *   }
 * }
 * 
 * // With custom error:
 * export async function DELETE(req: NextRequest) {
 *   try {
 *     const user = await getUser();
 *     if (!user.isAdmin) {
 *       throw new AppError("Insufficient permissions", ERROR_CODES.FORBIDDEN, 403);
 *     }
 *   } catch (error) {
 *     return handleError(error, { route: "DELETE /api/users", userId: user.id });
 *   }
 * }
 */
