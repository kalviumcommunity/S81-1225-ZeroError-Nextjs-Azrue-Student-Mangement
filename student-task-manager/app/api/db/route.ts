import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple connectivity check against PostgreSQL
    const rows = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW()`;
    const serverTime = rows?.[0]?.now ?? null;
    return NextResponse.json({ success: true, serverTime });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Database connection failed', error: String(error) },
      { status: 500 }
    );
  }
}
