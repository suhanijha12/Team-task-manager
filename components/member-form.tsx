"use client";

import { ProjectRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function MemberForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          role: formData.get("role")
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Could not add member.");
      }
      toast.success("Member added");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Member email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="role" name="role" defaultValue={ProjectRole.EDITOR}>
          <option value={ProjectRole.VIEWER}>Viewer</option>
          <option value={ProjectRole.EDITOR}>Editor</option>
          <option value={ProjectRole.CO_OWNER}>Co-owner</option>
          <option value={ProjectRole.ADMIN}>Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button disabled={pending} type="submit">
          {pending ? (
            <>
              <Spinner />
              Adding
            </>
          ) : (
            "Add"
          )}
        </Button>
      </div>
    </form>
  );
}
