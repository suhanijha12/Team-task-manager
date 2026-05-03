import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  CO_OWNER: "Co-owner",
  EDITOR: "Editor",
  MEMBER: "Member",
  VIEWER: "Viewer"
};

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } }
        }
      }
    },
    orderBy: { joinedAt: "desc" }
  });

  const projectIds = memberships.map((membership) => membership.projectId);
  const [counts, overdueTasks] = await prisma.$transaction([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      orderBy: { status: "asc" },
      _count: { id: true }
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.COMPLETED }
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
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

  const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Project health, overdue work, and task status across your teams.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<ListTodo className="h-4 w-4" />} label="Total tasks" value={total} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="In progress" value={byStatus.IN_PROGRESS} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={byStatus.COMPLETED} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={overdueTasks.length} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Your active project workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.length ? (
              memberships.map((membership) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
                  href={`/projects/${membership.project.id}`}
                  key={membership.projectId}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{membership.project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {membership.project._count.members} members · {membership.project._count.tasks} tasks
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{ROLE_LABELS[membership.role] ?? membership.role}</Badge>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Create your first project to start tracking work.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
            <CardDescription>Tasks past their due date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.length ? (
              overdueTasks.map((task) => (
                <Link
                  className="block rounded-md border p-3 transition-colors hover:bg-muted/60"
                  href={`/projects/${task.project.id}`}
                  key={task.id}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">{task.project.name}</div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No overdue tasks.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
