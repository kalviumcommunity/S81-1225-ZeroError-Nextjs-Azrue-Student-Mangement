import { sign, verify } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "./env";
import { ERROR_CODES } from "./errorCodes";
import { prisma } from "./prisma";

export const runtime = "nodejs";

export type JwtPayload = {
  id: number;
  email: string;
  role?: string;
  type?: "access" | "refresh";
  iat?: number;
  exp?: number;
};

// Token expiry durations
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "15m", 
  REFRESH_TOKEN: "7d",
} as const;

/**
 * Generate an access token (short-lived)
 * Used for API requests
 */
export function signAccessToken(payload: Omit<JwtPayload, "type">) {
  return sign({ ...payload, type: "access" }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
  });
}

/**
 * Generate a refresh token (long-lived)
 * Used to obtain new access tokens
 */
export function signRefreshToken(payload: Omit<JwtPayload, "type">) {
  return sign({ ...payload, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
  });
}

/**
 * Legacy function for backward compatibility
 */
export function signToken(payload: Omit<JwtPayload, "type">, expiresIn: number | string = "1h") {
  return sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any });
}

/**
 * Verify any JWT token and return payload
 */
export function verifyToken(token: string): { valid: boolean; payload?: JwtPayload; code?: string } {
  try {
    const decoded = verify(token, env.JWT_SECRET) as JwtPayload;
    return { valid: true, payload: decoded };
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return { valid: false, code: ERROR_CODES.TOKEN_EXPIRED };
    }
    return { valid: false, code: ERROR_CODES.INVALID_TOKEN };
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function getBearerToken(headerValue?: string | null): string | null {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Store refresh token in database with expiry
 */
export async function storeRefreshToken(userId: number, token: string, expiresInDays: number = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Use dynamic access to bypass potential Prisma Client staleness in IDE
  const client = prisma as any;
  return await client.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

/**
 * Verify refresh token exists in database and is not expired or revoked
 */
export async function verifyRefreshToken(token: string): Promise<{
  valid: boolean;
  userId?: number;
  code?: string;
}> {
  try {
    // First verify JWT signature and expiry
    const jwtResult = verifyToken(token);
    if (!jwtResult.valid) {
      return { valid: false, code: jwtResult.code };
    }

    // Check if token type is refresh
    if (jwtResult.payload?.type !== "refresh") {
      return { valid: false, code: ERROR_CODES.INVALID_TOKEN };
    }

    // Use dynamic access to bypass potential Prisma Client staleness in IDE
    const client = prisma as any;
    const storedToken = await client.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return { valid: false, code: ERROR_CODES.INVALID_TOKEN };
    }

    // Check if revoked
    if (storedToken.revokedAt) {
      return { valid: false, code: ERROR_CODES.TOKEN_REVOKED };
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      return { valid: false, code: ERROR_CODES.TOKEN_EXPIRED };
    }

    return { valid: true, userId: storedToken.userId };
  } catch {
    return { valid: false, code: ERROR_CODES.INVALID_TOKEN };
  }
}

/**
 * Revoke a refresh token (logout)
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const client = prisma as any;
    await client.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: number): Promise<boolean> {
  try {
    const client = prisma as any;
    await client.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const client = prisma as any;
    const result = await client.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}
