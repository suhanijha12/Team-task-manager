import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiCreated, apiOk, forbidden, handleRouteError } from "@/lib/errors";
import {
  assertAssigneeIsProjectMember,
  canWriteProjectTasks,
  requireProjectMember
} from "@/lib/permissions";
import {
  projectParamSchema,
  taskCreateSchema,
  taskQuerySchema
} from "@/lib/validators";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectMember(params.projectId, user.id);

    const query = taskQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const where = {
      projectId: params.projectId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignee ? { assigneeId: query.assignee } : {})
    };

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { [query.sort]: query.order },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.task.count({ where })
    ]);

    return apiOk({
      tasks,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    const membership = await requireProjectMember(params.projectId, user.id);
    if (!canWriteProjectTasks(membership.role)) {
      throw forbidden("Viewer access cannot create tasks.");
    }
    const input = taskCreateSchema.parse(await request.json());
    await assertAssigneeIsProjectMember(params.projectId, input.assigneeId);

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
        projectId: params.projectId,
        createdById: user.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return apiCreated({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}
