"use client";

import { ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";
import { ListFilter, Plus, Rows3, Search, SquareKanban } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TaskForm } from "@/components/task-form";
import { cn } from "@/lib/utils";

type MemberOption = {
  role: ProjectRole;
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

type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  project: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type TaskManagementViewProps = {
  title?: string;
  description?: string;
  tasks: TaskItem[];
  projects: ProjectOption[];
  writableProjects?: ProjectOption[];
  fixedProjectId?: string;
  showProjectFilter?: boolean;
  canAddTasks?: boolean;
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  UNDER_REVIEW: "Under Review",
  COMPLETED: "Completed"
};

const priorityVariant: Record<
  TaskPriority,
  "default" | "secondary" | "outline" | "destructive"
> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "destructive"
};

export function TaskManagementView({
  title = "Tasks",
  description = "Search, filter, and manage work across your task board.",
  tasks,
  projects,
  writableProjects,
  fixedProjectId,
  showProjectFilter = true,
  canAddTasks = true
}: TaskManagementViewProps) {
  const formProjects = writableProjects ?? projects;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [projectId, setProjectId] = useState(fixedProjectId ?? "ALL");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        task.project.name.toLowerCase().includes(normalizedQuery) ||
        task.assignee?.name.toLowerCase().includes(normalizedQuery) ||
        task.assignee?.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "ALL" || task.status === status;
      const matchesPriority =
        priority === "ALL" || task.priority === priority;
      const matchesProject =
        projectId === "ALL" || task.project.id === projectId;

      return (
        matchesQuery && matchesStatus && matchesPriority && matchesProject
      );
    });
  }, [priority, projectId, query, status, tasks]);
  const kanbanVersion = useMemo(
    () =>
      filteredTasks
        .map((task) =>
          [
            task.id,
            task.status,
            task.priority,
            task.dueDate ? new Date(task.dueDate).toISOString() : "",
            task.assignee?.id ?? ""
          ].join(":")
        )
        .join("|"),
    [filteredTasks]
  );

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canAddTasks ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={formProjects.length === 0}>
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add task</DialogTitle>
                  <DialogDescription>
                    Create a task, assign it, and place it in the right status.
                  </DialogDescription>
                </DialogHeader>
                <TaskForm
                  onCreated={() => setDialogOpen(false)}
                  projectId={fixedProjectId}
                  projects={
                    fixedProjectId
                      ? formProjects.filter((project) => project.id === fixedProjectId)
                      : formProjects
                  }
                />
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
        <div className="grid gap-3 xl:grid-cols-[1fr_160px_160px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, projects, assignees"
              value={query}
            />
          </div>
          <FilterSelect
            icon={<ListFilter className="h-4 w-4" />}
            label="Status"
            onChange={(value) => setStatus(value as "ALL" | TaskStatus)}
            value={status}
          >
            <option value="ALL">All statuses</option>
            {Object.values(TaskStatus).map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Priority"
            onChange={(value) => setPriority(value as "ALL" | TaskPriority)}
            value={priority}
          >
            <option value="ALL">All priorities</option>
            {Object.values(TaskPriority).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
          {showProjectFilter ? (
            <FilterSelect
              label="Project"
              onChange={setProjectId}
              value={projectId}
            >
              <option value="ALL">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </FilterSelect>
          ) : (
            <div />
          )}
          <div className="flex rounded-md border bg-background p-1">
            <Button
              aria-label="Kanban view"
              className={cn("h-8 flex-1", view === "kanban" && "bg-secondary")}
              onClick={() => setView("kanban")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <SquareKanban className="h-4 w-4" />
            </Button>
            <Button
              aria-label="List view"
              className={cn("h-8 flex-1", view === "list" && "bg-secondary")}
              onClick={() => setView("list")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "kanban" ? (
          <KanbanView
            key={kanbanVersion}
            tasks={filteredTasks}
            canDrag={canAddTasks}
          />
        ) : (
          <ListView tasks={filteredTasks} />
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  children,
  icon,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
      <select
        className={cn(
          "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
          icon && "pl-9"
        )}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function KanbanView({ tasks: initialTasks, canDrag = true }: { tasks: TaskItem[]; canDrag?: boolean }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  function handleDragStart(taskId: string) {
    setDraggingId(taskId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStatus(null);
  }

  async function handleDrop(targetStatus: TaskStatus) {
    if (!draggingId) return;
    const task = tasks.find((t) => t.id === draggingId);
    if (!task || task.status === targetStatus) {
      setDragOverStatus(null);
      return;
    }

    const previousStatus = task.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggingId ? { ...t, status: targetStatus } : t))
    );
    setDragOverStatus(null);

    try {
      const response = await fetch(
        `/api/projects/${task.project.id}/tasks/${draggingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus })
        }
      );
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === draggingId ? { ...t, status: previousStatus } : t))
      );
      toast.error("Failed to update task status.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {Object.values(TaskStatus).map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status);
        return (
          <div
            key={status}
            className={cn(
              "rounded-lg border bg-muted/20 p-3 transition-colors",
              canDrag && dragOverStatus === status && "border-primary bg-primary/5"
            )}
            onDragOver={canDrag ? (e) => { e.preventDefault(); setDragOverStatus(status); } : undefined}
            onDragLeave={canDrag ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStatus(null); } : undefined}
            onDrop={canDrag ? (e) => { e.preventDefault(); handleDrop(status); } : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">{statusLabels[status]}</div>
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {statusTasks.length ? (
                statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showStatus={false}
                    dragging={draggingId === task.id}
                    onDragStart={canDrag ? () => handleDragStart(task.id) : undefined}
                    onDragEnd={canDrag ? handleDragEnd : undefined}
                  />
                ))
              ) : (
                <EmptyTasks compact />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ tasks }: { tasks: TaskItem[] }) {
  if (!tasks.length) {
    return <EmptyTasks />;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} horizontal />
      ))}
    </div>
  );
}

function TaskCard({
  horizontal = false,
  showStatus = true,
  task,
  dragging,
  onDragStart,
  onDragEnd
}: {
  horizontal?: boolean;
  showStatus?: boolean;
  task: TaskItem;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  if (horizontal) {
    return (
      <div
        className="flex items-center gap-4 rounded-md border bg-background px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{task.title}</div>
          {task.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {task.assignee?.name ?? "Unassigned"}
          </span>
          <Badge variant="outline" className="hidden md:flex">{task.project.name}</Badge>
          <Badge variant="secondary">{statusLabels[task.status]}</Badge>
          <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3 transition-opacity",
        onDragStart && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40"
      )}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-sm font-medium leading-snug">{task.title}</span>
        <Badge variant={priorityVariant[task.priority]} className="shrink-0 text-xs">
          {task.priority}
        </Badge>
      </div>
      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{task.project.name}</span>
        <div className="flex shrink-0 items-center gap-2">
          {showStatus && (
            <Badge variant="secondary" className="text-xs font-normal">{statusLabels[task.status]}</Badge>
          )}
          <span className="truncate max-w-[80px]">{task.assignee?.name ?? "Unassigned"}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyTasks({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed text-center text-sm text-muted-foreground",
        compact ? "p-4" : "p-8"
      )}
    >
      No tasks match the current filters.
    </div>
  );
}
