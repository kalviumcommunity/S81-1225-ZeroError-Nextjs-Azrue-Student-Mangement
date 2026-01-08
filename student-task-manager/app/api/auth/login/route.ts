export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import {
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
} from "@/lib/auth";
import { sanitizeFields } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body ?? {};
  const cleaned = sanitizeFields({ email }, ["email"]);

  if (!email || !password) {
    return sendError(
      "Missing required fields: email and password are required",
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      400
    );
  }

  const user = await prisma.user.findUnique({ where: { email: cleaned.email } });
  if (!user) {
    return sendError(
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS,
      401
    );
  }

  const match = await compare(password, user.passwordHash);
  if (!match) {
    return sendError(
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS,
      401
    );
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

  await storeRefreshToken(user.id, refreshToken);

  const response = NextResponse.json({
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
