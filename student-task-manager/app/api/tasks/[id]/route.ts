import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus, TaskPriority } from '@prisma/client';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, priority: true, assigneeId: true, projectId: true, createdAt: true },
    });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Query failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = await req.json();
    const { title, status, priority, assigneeId, dueDate } = body ?? {};
    const allowedStatus: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
    const allowedPriority: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statusValue = status && allowedStatus.includes(status as TaskStatus) ? (status as TaskStatus) : undefined;
    const priorityValue = priority && allowedPriority.includes(priority as TaskPriority) ? (priority as TaskPriority) : undefined;
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(statusValue ? { status: statusValue } : {}),
        ...(priorityValue ? { priority: priorityValue } : {}),
        ...(assigneeId !== undefined ? { assigneeId: assigneeId ? Number(assigneeId) : null } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
      select: { id: true, title: true, status: true, priority: true, assigneeId: true, projectId: true, createdAt: true },
    });
    return NextResponse.json({ message: 'Task updated', task }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Update failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Task deleted' }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Delete failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
