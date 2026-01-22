import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

// Optimized query endpoint: select only needed fields, supports filters + pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get('take') ?? 20), 100);
  const skip = Number(searchParams.get('skip') ?? 0);
  const statusParam = searchParams.get('status');
  const allowedStatus: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
  const status: TaskStatus | undefined =
    statusParam && allowedStatus.includes(statusParam as TaskStatus)
      ? (statusParam as TaskStatus)
      : undefined;
  const assigneeId = searchParams.get('assigneeId');
  const projectId = searchParams.get('projectId');

  const where = {
    ...(status ? { status } : {}),
    ...(assigneeId ? { assigneeId: Number(assigneeId) } : {}),
    ...(projectId ? { projectId: Number(projectId) } : {}),
  };

  // Avoid over-fetching by selecting only fields needed in lists
  try {
    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);
    return NextResponse.json({ items, total, skip, take }, { status: 200 });
  } catch (error: any) {
    const msg = error?.code === 'P1001'
      ? 'Database is unreachable. Start PostgreSQL and run migrations.'
      : (error?.message ?? 'Query failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Bulk insert demo to show createMany performance
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId, count = 10 } = body ?? {};
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const data = Array.from({ length: Math.min(count, 1000) }, (_, i) => ({
    projectId: Number(projectId),
    title: `Bulk Task ${i + 1}`,
    priority: 'MEDIUM' as const,
  }));

  try {
    const result = await prisma.task.createMany({ data });
    return NextResponse.json({ inserted: result.count }, { status: 201 });
  } catch (error: any) {
    const msg = error?.code === 'P1001'
      ? 'Database is unreachable. Start PostgreSQL and run migrations.'
      : (error?.message ?? 'Bulk create failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
