import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiOk, forbidden, handleRouteError } from "@/lib/errors";
import {
  assertAssigneeIsProjectMember,
  canEditTask,
  canManageProjectPeople,
  requireTaskAccess
} from "@/lib/permissions";
import { taskParamSchema, taskUpdateSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = taskParamSchema.parse(await context.params);
    const { task } = await requireTaskAccess(params.taskId, user.id);
    return apiOk({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = taskParamSchema.parse(await context.params);
    const { task, membership } = await requireTaskAccess(params.taskId, user.id);

    if (
      !canEditTask({
        role: membership.role,
        userId: user.id,
        assigneeId: task.assigneeId,
        createdById: task.createdById
      })
    ) {
      throw forbidden("You can only edit tasks you own or are assigned to.");
    }

    const input = taskUpdateSchema.parse(await request.json());
    await assertAssigneeIsProjectMember(task.projectId, input.assigneeId);

    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: input,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return apiOk({ task: updatedTask });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = taskParamSchema.parse(await context.params);
    const { membership } = await requireTaskAccess(params.taskId, user.id);

    if (!canManageProjectPeople(membership.role)) {
      throw forbidden("Project admin access is required.");
    }

    await prisma.task.delete({
      where: { id: params.taskId }
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
