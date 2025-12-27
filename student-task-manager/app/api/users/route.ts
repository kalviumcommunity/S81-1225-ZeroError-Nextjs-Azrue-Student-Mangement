import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError, sendPaginatedSuccess, handlePrismaError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { getBearerToken, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = getBearerToken(authHeader);
  if (!token) {
    return sendError("Unauthorized: Missing Bearer token", ERROR_CODES.UNAUTHORIZED, 401);
  }

  const { valid, code } = verifyToken(token);
  if (!valid) {
    return sendError("Invalid or expired token", code ?? ERROR_CODES.INVALID_TOKEN, 401);
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const skip = (page - 1) * limit;

  try {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return sendPaginatedSuccess(items, total, page, limit, "Users fetched successfully");
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, passwordHash } = body ?? {};

    if (!name || !email || !passwordHash) {
      return sendError(
        "Missing required fields: name, email, and passwordHash are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: [!name && "name", !email && "email", !passwordHash && "passwordHash"].filter(Boolean) }
      );
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return sendSuccess(user, "User created successfully", 201);
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
