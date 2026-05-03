import Link from "next/link";
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

export default async function ProjectsPage() {
  const user = await requireUser();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          _count: { select: { members: true, tasks: true } }
        }
      }
    },
    orderBy: { joinedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage project teams, deadlines, and task boards.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {memberships.map((membership) => (
          <Card key={membership.projectId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{membership.project.name}</CardTitle>
                  <CardDescription>{membership.project.description || "No description"}</CardDescription>
                </div>
                <Badge variant="secondary">{ROLE_LABELS[membership.role] ?? membership.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {membership.project._count.members} members · {membership.project._count.tasks} tasks
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${membership.projectId}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
