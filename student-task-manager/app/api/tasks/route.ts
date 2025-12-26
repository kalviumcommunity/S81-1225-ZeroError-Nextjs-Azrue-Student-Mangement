import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 10)));
  const skip = (page - 1) * limit;

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
          projectId: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
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
    const { projectId, title, description, priority, assigneeId, dueDate } = body ?? {};
    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: {
        projectId: Number(projectId),
        title,
        description: description ?? null,
        priority: priority ?? undefined,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      select: { id: true, title: true, status: true, priority: true, assigneeId: true, createdAt: true },
    });
    return NextResponse.json({ message: 'Task created', task }, { status: 201 });
  } catch (error: any) {
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Create failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
