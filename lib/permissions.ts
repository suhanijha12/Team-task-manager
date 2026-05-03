import { ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";

export async function requireProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });

  if (!membership) {
    throw forbidden("You are not a member of this project.");
  }

  return membership;
}

export async function requireProjectAdmin(projectId: string, userId: string) {
  const membership = await requireProjectMember(projectId, userId);

  if (!canManageProjectPeople(membership.role)) {
    throw forbidden("Project admin or co-owner access is required.");
  }

  return membership;
}

export function canManageProjectPeople(role: ProjectRole) {
  return role === ProjectRole.ADMIN || role === ProjectRole.CO_OWNER;
}

export function canWriteProjectTasks(role: ProjectRole) {
  return (
    role === ProjectRole.ADMIN ||
    role === ProjectRole.CO_OWNER ||
    role === ProjectRole.EDITOR ||
    role === ProjectRole.MEMBER
  );
}

export async function requireTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!task) {
    throw notFound("Task not found.");
  }

  const membership = task.project.members[0];
  if (!membership) {
    throw forbidden("You are not a member of this project.");
  }

  return { task, membership };
}

export function canEditTask(params: {
  role: ProjectRole;
  userId: string;
  assigneeId: string | null;
  createdById: string;
}) {
  return (
    canManageProjectPeople(params.role) ||
    params.assigneeId === params.userId ||
    params.createdById === params.userId
  );
}

export async function assertAssigneeIsProjectMember(
  projectId: string,
  assigneeId?: string | null
) {
  if (!assigneeId) {
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: assigneeId
      }
    }
  });

  if (!membership) {
    throw forbidden("Assignee must be a member of the project.");
  }
}

export async function assertProjectHasAnotherAdmin(
  projectId: string,
  excludedUserId: string
) {
  const adminCount = await prisma.projectMember.count({
    where: {
      projectId,
      role: { in: [ProjectRole.ADMIN, ProjectRole.CO_OWNER] },
      NOT: {
        userId: excludedUserId
      }
    }
  });

  if (adminCount < 1) {
    throw forbidden("A project must have at least one admin.");
  }
}
