import { ProjectRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiOk, handleRouteError } from "@/lib/errors";
import {
  assertProjectHasAnotherAdmin,
  requireProjectAdmin
} from "@/lib/permissions";
import { memberParamSchema, memberUpdateSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ projectId: string; userId: string }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const actor = await requireUser();
    const params = memberParamSchema.parse(await context.params);
    await requireProjectAdmin(params.projectId, actor.id);
    const input = memberUpdateSchema.parse(await request.json());

    if (
      input.role !== ProjectRole.ADMIN &&
      input.role !== ProjectRole.CO_OWNER
    ) {
      await assertProjectHasAnotherAdmin(params.projectId, params.userId);
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId
        }
      },
      data: { role: input.role },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return apiOk({ member });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const actor = await requireUser();
    const params = memberParamSchema.parse(await context.params);
    await requireProjectAdmin(params.projectId, actor.id);
    await assertProjectHasAnotherAdmin(params.projectId, params.userId);

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId
        }
      }
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
