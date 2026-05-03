import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiOk, handleRouteError, notFound } from "@/lib/errors";
import { requireProjectAdmin, requireProjectMember } from "@/lib/permissions";
import { projectParamSchema, projectUpdateSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectMember(params.projectId, user.id);

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { joinedAt: "asc" }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      throw notFound("Project not found.");
    }

    return apiOk({ project });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectAdmin(params.projectId, user.id);
    const input = projectUpdateSchema.parse(await request.json());

    const project = await prisma.project.update({
      where: { id: params.projectId },
      data: input
    });

    return apiOk({ project });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectAdmin(params.projectId, user.id);

    await prisma.project.delete({
      where: { id: params.projectId }
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
