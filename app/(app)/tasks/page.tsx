import { TaskStatus } from "@prisma/client";
import { CheckCircle2, Clock, FolderKanban, ListTodo } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWriteProjectTasks } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskManagementView } from "@/components/task-management-view";

export default async function TasksPage() {
  const user = await requireUser();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } }
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
      }
    },
    orderBy: { joinedAt: "desc" }
  });

  const projects = memberships.map((m) => m.project);
  const writableProjects = memberships
    .filter((m) => canWriteProjectTasks(m.role))
    .map((m) => m.project);
  const tasks = projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      project: { id: project.id, name: project.name }
    }))
  );
  const completed = tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED
  ).length;
  const inProgress = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Manage task work across all projects you belong to.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<ListTodo className="h-4 w-4" />} label="Total tasks" value={tasks.length} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="In progress" value={inProgress} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completed} />
        <MetricCard icon={<FolderKanban className="h-4 w-4" />} label="Projects" value={projects.length} />
      </div>

      <TaskManagementView
        canAddTasks={writableProjects.length > 0}
        description="Search, filter, add tasks, and switch between list and kanban views across projects."
        projects={projects}
        writableProjects={writableProjects}
        tasks={tasks}
        title="All tasks"
      />
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
