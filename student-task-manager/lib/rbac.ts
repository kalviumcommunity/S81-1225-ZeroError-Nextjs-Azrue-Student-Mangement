import { logger } from "./logger";
import { sendError } from "./responseHandler";
import { ERROR_CODES } from "./errorCodes";

export type Role = "ADMIN" | "EDITOR" | "VIEWER" | string;
export type Permission = "create" | "read" | "update" | "delete" | string;

// Role to permission mapping
export const roles: Record<string, Permission[]> = {
  admin: ["create", "read", "update", "delete"],
  editor: ["read", "update"],
  viewer: ["read"],
};

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const key = String(role).toLowerCase();
  const perms = roles[key] || [];
  return perms.includes(permission);
}

/**
 * Require a specific permission for an API route.
 * Reads role from header `x-user-role` (middleware) or from an injected user object.
 */
export function requirePermission(req: Request, permission: Permission, context: {
  resource?: string;
  roleOverride?: Role;
} = {}) {
  const roleHeader = req.headers.get("x-user-role");
  const role = (context.roleOverride || roleHeader || "").toString();
  const allowed = hasPermission(role, permission);

  const pathname = context.resource || (typeof (req as any).nextUrl?.pathname === "string" ? (req as any).nextUrl.pathname : new URL((req as any).url || "http://localhost").pathname);
  logger.info("[RBAC] Access check", {
    role,
    permission,
    resource: pathname,
    allowed,
  });

  if (!allowed) {
    return sendError(
      `Access denied: insufficient permissions for ${permission}`,
      ERROR_CODES.FORBIDDEN,
      403
    );
  }

  return null; // no error
}
