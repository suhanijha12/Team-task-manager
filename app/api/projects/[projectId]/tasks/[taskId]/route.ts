import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiOk, forbidden, notFound, handleRouteError } from "@/lib/errors";
import { canWriteProjectTasks, requireProjectMember } from "@/lib/permissions";
import { projectParamSchema, taskParamSchema, taskUpdateSchema } from "@/lib/validators";

const paramsSchema = projectParamSchema.merge(taskParamSchema);

type Context = {
  params: Promise<{ projectId: string; taskId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = paramsSchema.parse(await context.params);
    const membership = await requireProjectMember(params.projectId, user.id);
    if (!canWriteProjectTasks(membership.role)) {
      throw forbidden("Viewer access cannot update tasks.");
    }

    const task = await prisma.task.findFirst({
      where: { id: params.taskId, projectId: params.projectId }
    });
    if (!task) throw notFound("Task not found.");

    const input = taskUpdateSchema.parse(await request.json());

    const updated = await prisma.task.update({
      where: { id: params.taskId },
      data: input,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return apiOk({ task: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
