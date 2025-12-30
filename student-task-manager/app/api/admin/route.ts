import { NextRequest } from "next/server";
import { sendSuccess } from "@/lib/responseHandler";

/**
 * GET /api/admin
 * Admin-only route - accessible only to users with admin role
 * Protected by middleware that verifies JWT and checks role
 */
export async function GET(req: NextRequest) {
    // User info is attached by middleware
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    return sendSuccess(
        {
            user: {
                email: userEmail,
                role: userRole,
            },
            adminFeatures: [
                "User Management",
                "System Configuration",
                "Analytics Dashboard",
                "Audit Logs",
            ],
        },
        "Welcome Admin! You have full access.",
        200
    );
}
