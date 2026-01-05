import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return sendError(
      "Missing required fields: email and password are required",
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      400
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return sendError("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS, 401);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return sendError("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS, 401);
  }

  const token = signToken({ id: user.id, email: user.email }, "1h");
  return sendSuccess({ token }, "Login successful");
}
