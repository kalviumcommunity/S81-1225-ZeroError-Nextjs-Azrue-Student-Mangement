import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ page, limit, total, items }, { status: 200 });
  } catch (error: any) {
    const msg = error?.code === "P1001"
      ? "Database is unreachable. Start PostgreSQL and run migrations."
      : (error?.message ?? "Query failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, passwordHash } = body ?? {};
    if (!name || !email || !passwordHash) {
      return NextResponse.json({ error: "name, email, passwordHash are required" }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json({ message: "User created", user }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    const msg = error?.code === "P1001"
      ? "Database is unreachable. Start PostgreSQL and run migrations."
      : (error?.message ?? "Create failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
