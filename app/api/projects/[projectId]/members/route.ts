import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, apiCreated, apiOk, handleRouteError } from "@/lib/errors";
import { requireProjectAdmin, requireProjectMember } from "@/lib/permissions";
import { memberCreateSchema, projectParamSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectMember(params.projectId, user.id);

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.projectId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { joinedAt: "asc" }
    });

    return apiOk({ members });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const params = projectParamSchema.parse(await context.params);
    await requireProjectAdmin(params.projectId, user.id);
    const input = memberCreateSchema.parse(await request.json());

    const memberUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!memberUser) {
      throw new AppError(404, "NOT_FOUND", "No user exists for that email.");
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: params.projectId,
        userId: memberUser.id,
        role: input.role
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return apiCreated({ member });
  } catch (error) {
    return handleRouteError(error);
  }
}
