# ProjektPilot Technical Architecture

**Version:** 2.0
**Date:** May 3, 2026

## 1. System Shape

ProjektPilot is a single full-stack Next.js application. The same deployable app owns the user interface, server-rendered pages, JSON API route handlers, authentication helpers, authorization helpers, validation, and database access.

The production target is Vercel for the Next.js runtime and Neon Postgres for persistent relational data.

## 2. Runtime Stack

| Layer | Technology |
|---|---|
| App framework | Next.js 16 App Router |
| UI runtime | React 19 with Server and Client Components |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI primitives | Local shadcn-style components, Radix UI, Lucide icons |
| Notifications | Sonner |
| Backend | Next.js Route Handlers under `app/api/**/route.ts` |
| Database | Neon Postgres |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT in httpOnly cookies, `jose`, `bcryptjs` |
| Tests | Vitest |
| Deployment | Vercel recommended |

## 3. Project Structure

```text
app/
  (app)/
    admin/page.tsx
    dashboard/page.tsx
    layout.tsx
    loading.tsx
    projects/
      page.tsx
      new/page.tsx
      [projectId]/
        page.tsx
        settings/page.tsx
    tasks/page.tsx
  (auth)/
    login/page.tsx
    signup/page.tsx
    loading.tsx
  api/
    auth/
    dashboard/
    projects/
    tasks/
  globals.css
  layout.tsx
  loading.tsx
  page.tsx
components/
  layout/app-shell.tsx
  ui/
  auth-form.tsx
  member-form.tsx
  project-form.tsx
  task-form.tsx
  task-management-view.tsx
lib/
  auth.ts
  db.ts
  errors.ts
  permissions.ts
  serializers.ts
  utils.ts
  validators.ts
prisma/
  migrations/
  schema.prisma
  seed.ts
docs/
  adr/
  prd-team-task-manager.md
  project-scope.md
  technical-architecture.md
proxy.ts
```

## 4. Routing and Rendering

The app uses route groups to separate public auth pages from authenticated app pages:

- `app/(auth)` contains login and signup.
- `app/(app)` contains dashboard, projects, tasks, admin, and authenticated shell routes.
- `app/api` contains JSON route handlers for client interactions and data mutations.

Server Components are preferred for authenticated read-heavy pages. Client Components are used for forms, dialogs, filtering, toasts, theme toggles, and drag/drop task board interactions.

`app/(app)/layout.tsx` calls `requireUser()` and wraps authenticated pages in the app shell. `proxy.ts` adds redirect behavior for configured app routes and redirects authenticated users away from auth pages. Server-side auth checks still happen inside API route handlers and protected data loaders through `requireUser()`.

## 5. Authentication

Authentication is centralized in `lib/auth.ts`.

Session behavior:

- Signup and login validate input with Zod.
- Passwords are hashed with bcrypt.
- Successful auth sets a JWT in an httpOnly cookie.
- `requireUser()` verifies the cookie, loads the user from Postgres, and rejects missing or invalid sessions.
- Logout clears the session cookie.

Environment requirement:

- `JWT_SECRET` must be at least 32 characters.

Cookie expectations:

- httpOnly
- same-site behavior for app navigation
- secure cookies in production

## 6. Authorization Model

Project membership is the primary authorization boundary. A user must have a `ProjectMember` row for a project before they can read or mutate that project.

Authorization helpers live in `lib/permissions.ts`:

- `requireProjectMember(projectId, userId)`
- `requireProjectAdmin(projectId, userId)`
- `requireTaskAccess(taskId, userId)`
- `canManageProjectPeople(role)`
- `canWriteProjectTasks(role)`
- `canEditTask(...)`
- `assertAssigneeIsProjectMember(projectId, assigneeId)`
- `assertProjectHasAnotherAdmin(projectId, excludedUserId)`

Role capabilities:

| Role | Read project | Create/update own tasks | Manage all tasks | Manage people/settings |
|---|---:|---:|---:|---:|
| `VIEWER` | Yes | No | No | No |
| `MEMBER` | Yes | Yes | No | No |
| `EDITOR` | Yes | Yes | No | No |
| `CO_OWNER` | Yes | Yes | Yes | Yes |
| `ADMIN` | Yes | Yes | Yes | Yes |

`requireProjectAdmin` currently means elevated project management access. It accepts `ADMIN` and `CO_OWNER`.

## 7. Database Architecture

Prisma owns schema definition, migrations, and generated TypeScript client access.

Datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Core models:

- `User`
- `Project`
- `ProjectMember`
- `Task`

Core enums:

```prisma
enum ProjectRole {
  ADMIN
  MEMBER
  CO_OWNER
  EDITOR
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}
```

Important relational rules:

- Project creator is stored on `Project.createdById`.
- Project access is stored in `ProjectMember`.
- A user can belong to a project only once because of `@@unique([projectId, userId])`.
- Project deletion cascades project members and tasks.
- Task assignee deletion or removal does not delete the task; assignee references are nullable.

## 8. API Design

Route handlers follow a consistent pattern:

1. Resolve the current user with `requireUser()` for protected endpoints.
2. Parse route params and request bodies with Zod validators.
3. Check project membership or role capability before database reads/writes.
4. Validate cross-record invariants such as assignee membership.
5. Use Prisma for persistence.
6. Return consistent JSON responses through `lib/errors.ts` helpers.

Implemented endpoint groups:

- `app/api/auth/**`
- `app/api/dashboard/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `app/api/projects/[projectId]/members/route.ts`
- `app/api/projects/[projectId]/members/[userId]/route.ts`
- `app/api/projects/[projectId]/tasks/route.ts`
- `app/api/projects/[projectId]/tasks/[taskId]/route.ts`
- `app/api/tasks/[taskId]/route.ts`

## 9. Validation and Error Handling

Validation schemas live in `lib/validators.ts` and cover:

- Auth payloads
- Project params
- Task params
- Member params
- Project create/update inputs
- Member create/update inputs
- Task create/update inputs
- Task query filters and pagination

Error helpers live in `lib/errors.ts`. Route handlers should throw typed application errors or return helper responses rather than each route inventing its own JSON error shape.

## 10. Data Fetching and UI State

Server-side data fetching is used for page-level authenticated data where practical. Client-side route calls are used for interactive workflows:

- Login/signup forms
- Logout
- Project creation and updates
- Member add/update/remove
- Task create/update/delete
- Kanban status transitions
- Task filters and view switching

`TaskManagementView` owns client-side search, filters, board/list switching, and optimistic status updates for the Kanban workflow.

## 11. Deployment and Configuration

Required environment variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled runtime Postgres connection string |
| `DIRECT_URL` | Direct Postgres connection string for migrations |
| `JWT_SECRET` | Session signing secret, minimum 32 characters |
| `NODE_ENV` | Runtime environment |

Production flow:

```bash
npm install
npm run db:deploy
npm run build
npm run start
```

Vercel deployments should run committed Prisma migrations before serving code that depends on the new schema.

## 12. Operational Boundaries

The current architecture is intentionally scoped to request/response product workflows. It does not include background workers, queue consumers, email delivery, file processing, or organization-level multi-tenancy.

Future extensions should preserve these boundaries:

- Keep authorization centralized in `lib/permissions.ts`.
- Keep validation centralized in `lib/validators.ts`.
- Keep auth cookie and user lookup logic centralized in `lib/auth.ts`.
- Add new database behavior through Prisma migrations.
- Keep Route Handlers thin and move shared business rules into `lib/`.
