import { NextRequest, NextResponse } from "next/server";
import { sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { verifyRefreshToken, signAccessToken, signRefreshToken, storeRefreshToken, revokeRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const requestId = Date.now().toString();
        logger.info("Token refresh request", { requestId });
        // Read from cookie first, fall back to body (for non-browser clients)
        let refreshToken = req.cookies.get("refreshToken")?.value;

        if (!refreshToken) {
            const body = await req.json().catch(() => ({}));
            refreshToken = body.refreshToken;
        }

        if (!refreshToken) {
            logger.warn("Refresh failed - missing token", { requestId });
            return sendError("Missing refresh token", ERROR_CODES.MISSING_REQUIRED_FIELD, 400);
        }

        const verification = await verifyRefreshToken(refreshToken);

        if (!verification.valid || !verification.userId) {
            logger.warn("Refresh failed - invalid or expired", { requestId });
            return sendError("Invalid or expired refresh token", verification.code || ERROR_CODES.INVALID_TOKEN, 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: verification.userId },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            logger.warn("Refresh failed - user not found", { requestId, userId: verification.userId });
            return sendError("User not found", ERROR_CODES.USER_NOT_FOUND, 404);
        }

        // Token Rotation: Revoke old, issue new
        await revokeRefreshToken(refreshToken);
        const newAccessToken = signAccessToken({ id: user.id, email: user.email });
        const newRefreshToken = signRefreshToken({ id: user.id, email: user.email });

        await storeRefreshToken(user.id, newRefreshToken);

        const response = NextResponse.json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: newAccessToken,
                user: { id: user.id, email: user.email, name: user.name },
            },
        });

        logger.info("Token refreshed", { requestId, userId: user.id });

        // Set refresh token in cookie
        response.cookies.set("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error: any) {
        logger.error("Refresh token error", { error: error?.message });
        return sendError("Failed to refresh token", ERROR_CODES.INTERNAL_ERROR, 500, error?.message);
    }
}
