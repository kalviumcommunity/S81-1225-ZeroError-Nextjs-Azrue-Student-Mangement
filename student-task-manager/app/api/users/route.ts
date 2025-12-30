import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendPaginatedSuccess } from "@/lib/responseHandler";
import { handleError, AppError } from "@/lib/errorHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { logger } from "@/lib/logger";
import { cacheAside, generateCacheKey, deleteCachePattern } from "@/lib/cache";

/**
 * GET /api/users
 * Protected route - accessible to all authenticated users
 * User info is provided by middleware via headers
 * 
 * Demonstrates centralized error handling with structured logging
 * Implements Redis caching with cache-aside pattern for performance optimization
 */
export async function GET(req: NextRequest) {
  try {
    // User info is attached by middleware after JWT verification
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip = (page - 1) * limit;

    logger.info("Fetching users", {
      userEmail,
      userRole,
      page,
      limit,
    });

    // Generate cache key based on pagination params
    const cacheKey = generateCacheKey("users", "list", page, limit);

    // Use cache-aside pattern: check cache first, fetch from DB on miss
    const result = await cacheAside(
      cacheKey,
      async () => {
        logger.info("Cache miss - Fetching from database", { cacheKey });

        const [items, total] = await prisma.$transaction([
          prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.user.count(),
        ]);

        return { items, total, page, limit };
      },
      { ttl: 60 } // Cache for 60 seconds
    );

    logger.info("Users fetched successfully", {
      count: result.items.length,
      total: result.total,
      page: result.page,
      cached: true,
    });

    return sendPaginatedSuccess(
      result.items,
      result.total,
      result.page,
      result.limit,
      `Users fetched successfully. Accessed by: ${userEmail} (${userRole})`
    );
  } catch (error) {
    return handleError(error, {
      route: "GET /api/users",
      userId: req.headers.get("x-user-email") || "unknown",
    });
  }
}

/**
 * POST /api/users
 * Creates a new user
 * 
 * Demonstrates validation error handling and custom errors
 * Implements cache invalidation to maintain cache coherence
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, passwordHash } = body ?? {};

    // Validation
    if (!name || !email || !passwordHash) {
      throw new AppError(
        "Missing required fields: name, email, and passwordHash are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400
      );
    }

    logger.info("Creating new user", { email });

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    logger.info("User created successfully", { userId: user.id, email: user.email });

    // Invalidate all users list cache entries (all pages)
    // This ensures the new user appears in subsequent list requests
    await deleteCachePattern("users:list:*");
    logger.info("Cache invalidated after user creation", { pattern: "users:list:*" });

    return sendSuccess(user, "User created successfully", 201);
  } catch (error) {
    return handleError(error, {
      route: "POST /api/users",
    });
  }
}
