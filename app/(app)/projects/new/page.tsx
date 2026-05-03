import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">New project</h1>
        <p className="text-sm text-muted-foreground">Create a project and invite members once it exists.</p>
      </div>
      <ProjectForm />
    </div>
  );
}
