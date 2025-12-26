import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError, sendPaginatedSuccess, handlePrismaError } from '@/lib/responseHandler';
import { ERROR_CODES } from '@/lib/errorCodes';

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

    return sendPaginatedSuccess(items, total, page, limit, 'Projects fetched successfully');
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, ownerId, name, description, dueDate } = body ?? {};

    if (!teamId || !ownerId || !name) {
      return sendError(
        'Missing required fields: teamId, ownerId, and name are required',
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: [!teamId && 'teamId', !ownerId && 'ownerId', !name && 'name'].filter(Boolean) }
      );
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

    return sendSuccess(project, 'Project created successfully', 201);
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
