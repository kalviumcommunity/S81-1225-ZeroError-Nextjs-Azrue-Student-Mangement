import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError, handlePrismaError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { sanitizeFields } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const requestId = Date.now().toString();
    logger.info("Signup request received", { requestId });
    const body = await req.json();
    const { name, email, password } = body ?? {};
    const cleaned = sanitizeFields({ name, email }, ["name", "email"]);

    if (!name || !email || !password) {
      return sendError(
        "Missing required fields: name, email, and password are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: [!name && "name", !email && "email", !password && "password"].filter(Boolean) }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: cleaned.email } });
    if (existing) {
      logger.warn("Signup failed - duplicate email", { requestId, email: cleaned.email });
      return sendError("Email already registered", ERROR_CODES.DUPLICATE_ENTRY, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name: cleaned.name, email: cleaned.email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Create a personal team and default project for the user (MVP convenience)
    const team = await prisma.team.create({
      data: {
        name: `${user.name}'s Team`,
        description: 'Personal team',
        ownerId: user.id,
      },
      select: { id: true },
    });

    await prisma.membership.create({
      data: { userId: user.id, teamId: team.id, role: 'OWNER' as any },
    });

    const project = await prisma.project.create({
      data: {
        name: 'My Tasks',
        description: 'Default personal project',
        teamId: team.id,
        ownerId: user.id,
      },
      select: { id: true, name: true },
    });

    logger.info("Signup successful", { requestId, userId: user.id, projectId: project.id });

    return sendSuccess({ ...user, defaultProjectId: project.id }, "Signup successful", 201);
  } catch (error: any) {
    logger.error("Signup failed", { error: error?.message });
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
