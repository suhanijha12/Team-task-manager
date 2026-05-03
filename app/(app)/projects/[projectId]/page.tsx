import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskStatus } from "@prisma/client";
import { CheckCircle2, Clock, ListTodo, Settings, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canManageProjectPeople,
  canWriteProjectTasks,
  requireProjectMember
} from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskManagementView } from "@/components/task-management-view";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await requireUser();
  const membership = await requireProjectMember(projectId, user.id);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
  });

  if (!project) {
    notFound();
  }
  const counts = Object.fromEntries(
    Object.values(TaskStatus).map((status) => [
      status,
      project.tasks.filter((task) => task.status === status).length
    ])
  ) as Record<TaskStatus, number>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">{project.name}</h1>
            <Badge variant="secondary">{membership.role}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.description || "No description"}</p>
        </div>
        {canManageProjectPeople(membership.role) ? (
          <Button asChild variant="outline">
            <Link href={`/projects/${project.id}/settings`}>
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<ListTodo className="h-4 w-4" />} label="Total tasks" value={project.tasks.length} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="In progress" value={counts.IN_PROGRESS} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={counts.COMPLETED} />
        <MetricCard icon={<Users className="h-4 w-4" />} label="Members" value={project.members.length} />
      </div>

      <TaskManagementView
        canAddTasks={canWriteProjectTasks(membership.role)}
        description="Search, filter, add tasks, and switch between list and kanban views for this project."
        fixedProjectId={project.id}
        projects={[project]}
        showProjectFilter={false}
        tasks={project.tasks.map((task) => ({
          ...task,
          project: { id: project.id, name: project.name }
        }))}
        title="Project tasks"
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
