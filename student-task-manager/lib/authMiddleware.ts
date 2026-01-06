import { NextRequest } from "next/server";
import { sendError } from "./responseHandler";
import { ERROR_CODES } from "./errorCodes";
import { getBearerToken, verifyToken } from "./auth";

/**
 * Middleware to protect API routes requiring authentication
 * Validates access token from Authorization header
 * 
 * Usage in API routes:
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const authResult = await requireAuth(req);
 *   if (authResult.error) return authResult.error;
 *   
 *   const user = authResult.user;
 *   // ... your protected route logic
 * }
 * ```
 */
export async function requireAuth(req: NextRequest): Promise<{
    user?: { id: number; email: string };
    error?: Response;
}> {
    const authHeader = req.headers.get("authorization");
    const token = getBearerToken(authHeader);

    if (!token) {
        return {
            error: sendError(
                "Authorization header with Bearer token required",
                ERROR_CODES.UNAUTHORIZED,
                401
            ),
        };
    }

    const verification = verifyToken(token);

    if (!verification.valid || !verification.payload) {
        const message =
            verification.code === ERROR_CODES.TOKEN_EXPIRED
                ? "Access token expired - please refresh"
                : "Invalid access token";

        return {
            error: sendError(message, verification.code || ERROR_CODES.INVALID_TOKEN, 401),
        };
    }

    // Verify token type is access token
    if (verification.payload.type && verification.payload.type !== "access") {
        return {
            error: sendError(
                "Invalid token type - access token required",
                ERROR_CODES.INVALID_TOKEN,
                401
            ),
        };
    }

    return {
        user: {
            id: verification.payload.id,
            email: verification.payload.email,
        },
    };
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
export async function optionalAuth(req: NextRequest): Promise<{
    user?: { id: number; email: string };
}> {
    const authHeader = req.headers.get("authorization");
    const token = getBearerToken(authHeader);

    if (!token) {
        return {};
    }

    const verification = verifyToken(token);

    if (!verification.valid || !verification.payload) {
        return {};
    }

    return {
        user: {
            id: verification.payload.id,
            email: verification.payload.email,
        },
    };
}
