import { NextRequest, NextResponse } from "next/server";
import { sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { revokeRefreshToken, revokeAllUserTokens, getBearerToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { all } = body ?? {};
        let refreshToken = body.refreshToken || req.cookies.get("refreshToken")?.value;

        // If "all" flag is set, revoke all tokens for the authenticated user
        if (all) {
            const authHeader = req.headers.get("authorization");
            const accessToken = getBearerToken(authHeader);

            if (!accessToken) {
                return sendError("Authorization header required for logout all", ERROR_CODES.UNAUTHORIZED, 401);
            }

            const verification = verifyToken(accessToken);
            if (!verification.valid || !verification.payload?.id) {
                return sendError("Invalid access token", verification.code || ERROR_CODES.INVALID_TOKEN, 401);
            }

            await revokeAllUserTokens(verification.payload.id);

            const response = NextResponse.json({
                success: true,
                message: "Logged out from all devices successfully",
            });
            response.cookies.delete("refreshToken");
            return response;
        }

        // Single token revocation
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }

        const response = NextResponse.json({
            success: true,
            message: "Logged out successfully",
        });
        response.cookies.delete("refreshToken");
        return response;
    } catch (error: any) {
        return sendError("Logout failed", ERROR_CODES.INTERNAL_ERROR, 500, error?.message);
    }
}
