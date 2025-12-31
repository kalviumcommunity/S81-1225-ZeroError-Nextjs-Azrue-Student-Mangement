import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STR = process.env.JWT_SECRET || "supersecretkey";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle Public routes
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  // Handle API protection (Existing logic)
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/users")) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token missing" },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-email", String(payload.email));
      requestHeaders.set("x-user-role", String(payload.role));

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 403 }
      );
    }
  }

  // Handle Protected Page routes (Routing Lesson Logic)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Special case for the "mock.jwt.token" used in the lesson's login page
      if (token === "mock.jwt.token") {
        return NextResponse.next();
      }

      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/api/admin/:path*",
    "/api/users/:path*",
  ],
};
