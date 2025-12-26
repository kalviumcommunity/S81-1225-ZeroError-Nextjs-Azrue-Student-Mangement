import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 10)));
  const skip = (page - 1) * limit;
  const teamId = searchParams.get('teamId');

  const where = {
    ...(teamId ? { teamId: Number(teamId) } : {}),
  } as const;

  try {
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        select: { id: true, name: true, teamId: true, ownerId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);
    return NextResponse.json({ page, limit, total, items }, { status: 200 });
  } catch (error: any) {
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Query failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, ownerId, name, description, dueDate } = body ?? {};
    if (!teamId || !ownerId || !name) {
      return NextResponse.json({ error: 'teamId, ownerId, name are required' }, { status: 400 });
    }
    const project = await prisma.project.create({
      data: {
        teamId: Number(teamId),
        ownerId: Number(ownerId),
        name,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      select: { id: true, name: true, teamId: true, ownerId: true, createdAt: true },
    });
    return NextResponse.json({ message: 'Project created', project }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Project name already exists in team' }, { status: 400 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Create failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
