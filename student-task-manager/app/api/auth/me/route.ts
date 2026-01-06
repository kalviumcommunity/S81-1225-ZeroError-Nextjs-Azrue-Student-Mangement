import { NextRequest } from "next/server";
import { sendSuccess } from "@/lib/responseHandler";
import { requireAuth } from "@/lib/authMiddleware";

/**
 * GET /api/auth/me
 * Protected route example - returns current user information
 * Requires valid access token in Authorization header
 */
export async function GET(req: NextRequest) {
    // Validate authentication
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;

    const user = authResult.user!;

    return sendSuccess(
        {
            id: user.id,
            email: user.email,
            message: "You are authenticated!",
        },
        "User retrieved successfully"
    );
}
