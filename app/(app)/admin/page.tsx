import Link from "next/link";
import { ProjectRole } from "@prisma/client";
import { ShieldCheck, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberForm } from "@/components/member-form";

const roleLabels: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  CO_OWNER: "Co-owner",
  EDITOR: "Editor",
  VIEWER: "Viewer"
};

const roleDescriptions = [
  {
    role: "Viewer",
    description: "Can view project details and tasks without creating or editing work."
  },
  {
    role: "Editor",
    description: "Can create tasks and update tasks they own or are assigned to."
  },
  {
    role: "Co-owner",
    description: "Can manage project people, settings, and all project tasks."
  },
  {
    role: "Admin",
    description: "Full project administration access. At least one admin or co-owner is required."
  }
];

export default async function AdminPage() {
  const user = await requireUser();
  const adminMemberships = await prisma.projectMember.findMany({
    where: {
      userId: user.id,
      role: { in: ["ADMIN", "CO_OWNER"] as ProjectRole[] }
    },
    include: {
      project: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            },
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }]
          },
          _count: { select: { tasks: true, members: true } }
        }
      }
    },
    orderBy: { joinedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage project people, access levels, and ownership.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roleDescriptions.map((item) => (
          <div key={item.role} className="rounded-lg border bg-card px-4 py-3">
            <div className="text-sm font-medium">{item.role}</div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        {adminMemberships.length ? (
          adminMemberships.map((membership) => (
            <Card key={membership.projectId}>
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      {membership.project.name}
                    </CardTitle>
                    <CardDescription>
                      {membership.project._count.members} people · {membership.project._count.tasks} tasks
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${membership.projectId}/settings`}>
                      Settings
                    </Link>
                  </Button>
                </div>
                <MemberForm projectId={membership.projectId} />
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {membership.project.members.map((member) => (
                    <div
                      className="flex items-center justify-between gap-4 px-4 py-3"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                          {getInitials(member.user.name || member.user.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium leading-tight">
                            {member.user.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground leading-tight">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant={member.role === ProjectRole.ADMIN ? "default" : "secondary"} className="shrink-0">
                        {roleLabels[member.role]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">No admin projects</div>
                <div className="text-sm text-muted-foreground">
                  You need admin or co-owner access to manage project people.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
