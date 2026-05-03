"use client";

import { TaskPriority, TaskStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type MemberOption = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type ProjectOption = {
  id: string;
  name: string;
  members: MemberOption[];
};

export function TaskForm({
  projectId,
  projects,
  onCreated
}: {
  projectId?: string;
  projects: ProjectOption[];
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId ?? projects[0]?.id ?? ""
  );
  const [pending, setPending] = useState(false);
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );
  const members = selectedProject?.members ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const dueDate = formData.get("dueDate")?.toString();
    const assigneeId = formData.get("assigneeId")?.toString();
    const targetProjectId = formData.get("projectId")?.toString();

    if (!targetProjectId) {
      toast.error("Choose a project before creating a task.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${targetProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          status: formData.get("status"),
          priority: formData.get("priority"),
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Could not create task.");
      }
      toast.success("Task created");
      form.reset();
      onCreated?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create task.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="projectId">Project</Label>
        {projectId ? (
          <input name="projectId" type="hidden" value={projectId} />
        ) : null}
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          disabled={Boolean(projectId)}
          id="projectId"
          name={projectId ? undefined : "projectId"}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          value={selectedProjectId}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={2} maxLength={200} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" maxLength={2000} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assigneeId">Assignee</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="assigneeId" name="assigneeId">
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="priority" name="priority" defaultValue={TaskPriority.MEDIUM}>
          {Object.values(TaskPriority).map((priority) => (
            <option key={priority} value={priority}>
              {priority.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="status" name="status" defaultValue={TaskStatus.TODO}>
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>
      <div className="md:col-span-2">
        <Button disabled={pending} type="submit">
          {pending ? (
            <>
              <Spinner />
              Creating task
            </>
          ) : (
            "Create task"
          )}
        </Button>
      </div>
    </form>
  );
}
