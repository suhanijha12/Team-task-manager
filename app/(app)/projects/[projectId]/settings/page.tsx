import { notFound } from "next/navigation";
import { ProjectRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireProjectAdmin } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberForm } from "@/components/member-form";

const roleLabels: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  CO_OWNER: "Co-owner",
  EDITOR: "Editor",
  VIEWER: "Viewer"
};

type SettingsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSettingsPage({ params }: SettingsPageProps) {
  const { projectId } = await params;
  const user = await requireUser();
  await requireProjectAdmin(projectId, user.id);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }]
      }
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Project settings</h1>
        <p className="text-sm text-muted-foreground">Manage members and roles for {project.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add member</CardTitle>
          <CardDescription>Users must already have an account before they can be added.</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm projectId={project.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Every project must keep at least one admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.members.map((member) => (
            <div className="flex items-center justify-between rounded-md border p-4" key={member.id}>
              <div>
                <div className="font-medium">{member.user.name}</div>
                <div className="text-sm text-muted-foreground">{member.user.email}</div>
              </div>
              <Badge variant={member.role === ProjectRole.ADMIN ? "default" : "secondary"}>{roleLabels[member.role]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
