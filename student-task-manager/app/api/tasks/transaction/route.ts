import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskPriority } from '@prisma/client';

// Transaction: create task + activity log; optional failure to verify rollback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, title, description, assigneeId, priority, fail } = body ?? {};
    const allowedPriority: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const priorityValue = priority && allowedPriority.includes(priority as TaskPriority) ? (priority as TaskPriority) : undefined;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId: Number(projectId),
          title,
          description: description ?? null,
          priority: priorityValue,
          assigneeId: assigneeId ? Number(assigneeId) : null,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assigneeId: true,
          projectId: true,
          createdAt: true,
        },
      });

      const log = await tx.activityLog.create({
        data: {
          actorId: task.assigneeId ?? 1, // fallback demo actor; replace with auth user
          projectId: task.projectId,
          taskId: task.id,
          action: 'TASK_CREATED',
          details: `Task ${task.title} created via transaction`,
        },
        select: { id: true, action: true, createdAt: true },
      });

      if (fail) {
        throw new Error('Intentional failure to verify rollback');
      }

      return { task, log };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error: any) {
    const msg = error?.code === 'P1001'
      ? 'Database is unreachable. Start PostgreSQL and run migrations.'
      : (error?.message ?? 'Transaction failed');
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
