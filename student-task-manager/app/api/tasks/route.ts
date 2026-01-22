import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError, sendPaginatedSuccess, handlePrismaError } from '@/lib/responseHandler';
import { ERROR_CODES } from '@/lib/errorCodes';
import { logger } from '@/lib/logger';

// Type-safe task status values (matches Prisma schema)
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export async function GET(req: NextRequest) {
  const requestId = Date.now().toString();
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
    logger.info('Tasks list request', { requestId, page, limit, status, assigneeId, projectId });
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

    return sendPaginatedSuccess(items, total, page, limit, 'Tasks fetched successfully');
  } catch (error: any) {
    logger.error('Tasks list error', { requestId, error: error?.message });
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestId = Date.now().toString();
    const body = await req.json();
    const { projectId, title, description, priority, assigneeId, dueDate } = body ?? {};

    if (!projectId || !title) {
      logger.warn('Task create failed - missing fields', { requestId, projectId, title });
      return sendError(
        'Missing required fields: projectId and title are required',
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: [!projectId && 'projectId', !title && 'title'].filter(Boolean) }
      );
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

    logger.info('Task created', { requestId, taskId: task.id, projectId });
    return sendSuccess(task, 'Task created successfully', 201);
  } catch (error: any) {
    logger.error('Task create error', { error: error?.message });
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
