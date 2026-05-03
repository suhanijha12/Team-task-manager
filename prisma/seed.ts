import { PrismaClient, ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Demo Admin",
      email: "admin@demo.com",
      passwordHash
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@demo.com" },
    update: {},
    create: {
      name: "Demo Member",
      email: "member@demo.com",
      passwordHash
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Launch Readiness",
      description: "Prepare the first production rollout.",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: ProjectRole.ADMIN },
          { userId: member.id, role: ProjectRole.MEMBER }
        ]
      }
    }
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Finalize deployment checklist",
        description: "Confirm environment variables, migrations, and smoke tests.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
      },
      {
        title: "Review onboarding copy",
        description: "Tighten the first-run messaging for new team members.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      },
      {
        title: "Close stale QA notes",
        description: "Archive notes that no longer apply to the release scope.",
        status: TaskStatus.UNDER_REVIEW,
        priority: TaskPriority.LOW,
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id
      }
    ],
    skipDuplicates: true
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
