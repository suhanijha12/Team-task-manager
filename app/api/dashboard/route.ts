import { ProjectRole, TaskStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiOk, handleRouteError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireUser();
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            deadline: true,
            _count: { select: { tasks: true, members: true } }
          }
        }
      }
    });

    const projectIds = memberships.map((membership) => membership.projectId);
    const taskWhere = {
      projectId: { in: projectIds },
      OR: [
        { assigneeId: user.id },
        {
          project: {
            members: {
              some: {
                userId: user.id,
                role: { in: ["ADMIN", "CO_OWNER"] as ProjectRole[] }
              }
            }
          }
        }
      ]
    };

    const [counts, overdueTasks] = await prisma.$transaction([
      prisma.task.groupBy({
        by: ["status"],
        where: taskWhere,
        orderBy: { status: "asc" },
        _count: { id: true }
      }),
      prisma.task.findMany({
        where: {
          ...taskWhere,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.COMPLETED }
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } }
        },
        orderBy: { dueDate: "asc" },
        take: 10
      })
    ]);

    const byStatus = Object.fromEntries(
      Object.values(TaskStatus).map((status) => [status, 0])
    ) as Record<TaskStatus, number>;

    for (const count of counts) {
      byStatus[count.status] =
        (count._count as { id?: number } | undefined)?.id ?? 0;
    }

    return apiOk({
      stats: {
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        byStatus,
        overdue: overdueTasks.length
      },
      overdueTasks,
      projects: memberships.map((membership) => ({
        ...membership.project,
        role: membership.role
      }))
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
