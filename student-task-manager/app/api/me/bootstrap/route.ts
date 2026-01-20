import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError, handlePrismaError } from "@/lib/responseHandler";
import { requireAuth } from "@/lib/authMiddleware";

// GET /api/me/bootstrap
// Returns lightweight dashboard bootstrap data for the authenticated user
export async function GET(req: NextRequest) {
  // AuthN
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  try {
    // Find a default/personal project owned by the user. If multiple, pick earliest created.
    const project = await prisma.project.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });

    if (!project) {
      return sendSuccess(
        {
          defaultProject: null,
          stats: { total: 0, pending: 0, completed: 0 },
          latest: [],
        },
        "No personal project found yet"
      );
    }

    const [total, completed, latest] = await Promise.all([
      prisma.task.count({ where: { projectId: project.id } }),
      prisma.task.count({ where: { projectId: project.id, status: "DONE" } }),
      prisma.task.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          dueDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const pending = Math.max(0, total - completed);

    return sendSuccess(
      {
        defaultProject: { id: project.id, name: project.name },
        stats: { total, pending, completed },
        latest,
      },
      "Bootstrap data fetched"
    );
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
