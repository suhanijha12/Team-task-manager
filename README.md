# ProjektPilot

ProjektPilot is a production-ready team task management app for small teams that need one place to plan project work, assign responsibilities, track task progress, and manage project access. It combines authenticated project workspaces, role-based permissions, project dashboards, task boards, and member management in a single Next.js application backed by Postgres.

The app is designed for teams that need more structure than a shared checklist but do not need a heavyweight enterprise project management system. A user can create a project, add team members, define work as tasks, assign ownership, move work through a review lifecycle, and keep visibility across all active work from global and project-specific views.

## What Users Can Do

- **Create and manage projects** with names, descriptions, deadlines, member lists, and project-level settings.
- **Invite existing users into projects** and assign access levels that control whether they can view work, edit tasks, or manage the project.
- **Plan and track tasks** with title, description, assignee, priority, due date, and status.
- **Use Kanban or list workflows** to move tasks from `TODO` to `IN_PROGRESS`, `UNDER_REVIEW`, and `COMPLETED`.
- **Search and filter work** by query, status, priority, and project so users can quickly narrow down active tasks.
- **See dashboard summaries** for project counts, active work, task status totals, and overdue items.
- **Manage workspace administration** through a dedicated admin area for people and project access decisions.

## Product Scope

ProjektPilot is scoped around collaborative project execution:

- **Project owners and co-owners** can create projects, manage project settings, add or remove members, and control who can make changes.
- **Editors and members** can contribute to task execution inside projects they belong to.
- **Viewers** can follow project progress without changing project data.
- **Individual contributors** can use the global task view to see their assigned work across multiple projects.
- **Small team leads** can use project dashboards to monitor deadlines, progress, and workload without switching tools.

The current scope intentionally focuses on core project and task operations. It does not include chat, file storage, billing, notifications, calendars, time tracking, or public project sharing. Those can be added later without changing the core project/member/task model.

For a deeper product and technical scope, see [docs/project-scope.md](docs/project-scope.md).

## Tech Stack

- **Framework** — Next.js 16 (App Router, React 19, TypeScript)
- **Database** — PostgreSQL (Neon) via Prisma ORM
- **Auth** — JWT sessions in httpOnly cookies (`jose`, `bcryptjs`)
- **UI** — Tailwind CSS, Radix UI primitives, Lucide icons, Sonner toasts
- **Validation** — Zod

## Application Surfaces

- **Auth pages** - signup and login flows with JWT sessions stored in httpOnly cookies.
- **Dashboard** - authenticated home surface for project/task summaries and quick access.
- **Projects** - project list, project creation, project detail dashboards, and project settings.
- **Tasks** - global task management across accessible projects with filters and board/list views.
- **Admin** - workspace-oriented surface for project-role and people management.
- **API route handlers** - JSON endpoints under `app/api/**` for auth, dashboards, projects, members, and tasks.

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon recommended)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment variables and fill them in:

   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations:

   ```bash
   npm run db:migrate
   ```

4. (Optional) Seed the database with sample data:

   ```bash
   npm run db:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (with pooling) |
| `DIRECT_URL` | PostgreSQL direct connection (without pooling, for migrations) |
| `JWT_SECRET` | Secret key for signing sessions — minimum 32 characters |
| `NODE_ENV` | `development` or `production` |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run tests with Vitest |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:deploy` | Apply existing migrations (for production deployments) |
| `npm run db:seed` | Seed the database |

## Data Model

### Roles

Project members are assigned one of five roles that control what they can do:

| Role | Permissions |
|---|---|
| **Viewer** | Read-only access to project and tasks |
| **Member** | Can create and update tasks they own or are assigned to |
| **Editor** | Same as Member |
| **Co-owner** | Can manage members, settings, and all tasks |
| **Admin** | Full access — at least one admin is required per project |

### Task Statuses

`TODO` → `IN_PROGRESS` → `UNDER_REVIEW` → `COMPLETED`

### Task Priorities

`LOW`, `MEDIUM`, `HIGH`

## Project Structure

```
app/
  (app)/          # Authenticated routes (dashboard, projects, tasks, admin)
  (auth)/         # Login and signup pages
  api/            # API route handlers
components/
  layout/         # App shell, sidebar
  ui/             # Shared UI primitives
lib/
  auth.ts         # Session management
  db.ts           # Prisma client
  permissions.ts  # Role-based access helpers
  validators.ts   # Zod schemas
prisma/
  schema.prisma   # Database schema
  migrations/     # Migration history
```
