import jwt from "jsonwebtoken";
import { env } from "./env";
import { ERROR_CODES } from "./errorCodes";

type JwtPayload = {
  id: number;
  email: string;
};

export function signToken(payload: JwtPayload, expiresIn: string | number = "1h") {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): { valid: boolean; payload?: JwtPayload; code?: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return { valid: true, payload: decoded };
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return { valid: false, code: ERROR_CODES.TOKEN_EXPIRED };
    }
    return { valid: false, code: ERROR_CODES.INVALID_TOKEN };
  }
}

export function getBearerToken(headerValue?: string | null): string | null {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}
