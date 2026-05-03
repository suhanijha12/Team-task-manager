import { ProjectRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiCreated, apiOk, handleRouteError } from "@/lib/errors";
import { projectCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: user.id }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return apiOk({ projects });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = projectCreateSchema.parse(await request.json());

    const project = await prisma.$transaction(async (tx) =>
      tx.project.create({
        data: {
          name: input.name,
          description: input.description,
          deadline: input.deadline,
          createdById: user.id,
          members: {
            create: {
              userId: user.id,
              role: ProjectRole.ADMIN
            }
          }
        },
        include: {
          members: true,
          _count: {
            select: { tasks: true }
          }
        }
      })
    );

    return apiCreated({ project });
  } catch (error) {
    return handleRouteError(error);
  }
}
