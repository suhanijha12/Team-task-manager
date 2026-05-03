import { TaskPriority, TaskStatus, ProjectRole } from "@prisma/client";
import { z } from "zod";

const trimmedString = z.string().trim();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value ?? "");

export const uuidParamSchema = z.object({
  id: z.string().uuid()
});

export const projectParamSchema = z.object({
  projectId: z.string().uuid()
});

export const taskParamSchema = z.object({
  taskId: z.string().uuid()
});

export const memberParamSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid()
});

export const signupSchema = z
  .object({
    name: trimmedString.min(2).max(50),
    email: trimmedString.email().max(255).toLowerCase(),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
      .regex(/[0-9]/, "Password must include at least one number."),
    confirmPassword: z.string().optional()
  })
  .refine(
    (data) => !data.confirmPassword || data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match."
    }
  );

export const loginSchema = z.object({
  email: trimmedString.email().max(255).toLowerCase(),
  password: z.string().min(1).max(128)
});

export const projectCreateSchema = z.object({
  name: trimmedString.min(2).max(100),
  description: optionalText(500),
  deadline: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value) : null))
});

export const projectUpdateSchema = projectCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required."
);

export const memberCreateSchema = z.object({
  email: trimmedString.email().max(255).toLowerCase(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.EDITOR)
});

export const memberUpdateSchema = z.object({
  role: z.nativeEnum(ProjectRole)
});

export const taskCreateSchema = z.object({
  title: trimmedString.min(2).max(200),
  description: optionalText(2000),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value) : null)),
  assigneeId: z.string().uuid().optional().nullable()
});

export const taskUpdateSchema = taskCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required."
);

export const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignee: z.string().uuid().optional(),
  sort: z.enum(["dueDate", "priority", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
