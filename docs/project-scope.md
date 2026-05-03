# ProjektPilot Project Scope

## Purpose

ProjektPilot helps small teams coordinate project execution without spreading work across spreadsheets, message threads, and disconnected task lists. The application gives each team a shared project workspace where members can see what exists, who owns it, what needs attention, and what is already complete.

The product is built around three core records:

- **Users** represent authenticated people who can create projects, join projects, and own tasks.
- **Projects** group related work, members, deadlines, and permissions.
- **Tasks** represent actionable units of work inside a project.

This keeps the product focused: every screen either helps a user understand project progress, manage access, or move task work forward.

## Target Users

ProjektPilot is intended for:

- **Team leads** who need to organize project work, assign responsibilities, and monitor progress.
- **Project owners** who need member management and permission controls without a separate admin system.
- **Contributors** who need a clear view of their assigned work and the status of related project tasks.
- **Observers or stakeholders** who need read-only visibility into progress without edit access.

The app works best for small to medium project teams where the primary workflow is structured task management, not long-form planning, document collaboration, or ticketing at enterprise scale.

## Core Workflows

### Account and Session Management

Users can sign up, log in, and maintain an authenticated session through secure httpOnly JWT cookies. Protected pages and API routes require an authenticated user before returning project or task data.

### Project Management

Users can create projects with descriptive context and optional deadlines. The creator becomes a project administrator, which gives them full control over the project, its members, and its tasks.

Project pages are dashboard-oriented. They prioritize progress, task activity, members, and actionable controls rather than forcing large creation forms into the main view.

### Member and Role Management

Project access is controlled through project membership rows. Each member has a role that defines what they can do:

| Role | Intended use |
|---|---|
| `VIEWER` | Read-only project visibility for stakeholders or observers |
| `MEMBER` | Basic task participation and legacy compatibility |
| `EDITOR` | Active task contribution inside a project |
| `CO_OWNER` | Project management without being the original admin |
| `ADMIN` | Full project control |

`ADMIN` and `CO_OWNER` roles can manage project members and settings. Lower roles are intended for execution and visibility rather than access administration.

### Task Planning and Execution

Tasks capture the work that needs to happen inside a project. Each task can include:

- Title and description
- Status
- Priority
- Due date
- Optional assignee
- Project relationship

Users can view tasks in a Kanban board or list. The board supports status movement across:

`TODO` -> `IN_PROGRESS` -> `UNDER_REVIEW` -> `COMPLETED`

The product does not enforce a strict transition graph. Teams can move work backward or forward as reality changes.

### Search and Filtering

The task management surface supports filtering by query, status, priority, and project. This makes it usable as both a project-specific execution view and a global work queue across projects.

### Dashboard Visibility

Dashboards summarize active work so users can understand project health quickly. The current app supports high-signal operational visibility such as task totals, status distribution, overdue work, and project navigation.

## Technical Scope

ProjektPilot is a single Next.js application. The frontend, server-rendered pages, backend route handlers, and auth/session logic live in one codebase.

### Runtime Responsibilities

- **Next.js App Router** renders authenticated app pages and public auth pages.
- **Route Handlers** expose JSON APIs for auth, dashboards, projects, members, and tasks.
- **Prisma** owns typed database access and migrations.
- **Neon Postgres** stores users, project memberships, projects, and tasks.
- **JWT cookies** provide stateless session handling.
- **Zod schemas** validate incoming request payloads before writes.

### Security and Permission Boundaries

The app treats project membership as the main authorization boundary. A user should only see or mutate projects and tasks that are reachable through their membership. Role checks are centralized in permission helpers so route handlers and pages do not duplicate access logic.

Important boundaries:

- Unauthenticated users can only access login and signup flows.
- Authenticated users can only see projects where they are members.
- Project member management requires elevated project roles.
- Task writes require project access and the correct role capability.
- Local `.env` files, build output, generated dependencies, Vercel project metadata, and archive files are excluded from Git.

## Out of Scope for the Current Version

The current version does not implement:

- Email invites or notification delivery
- Password reset
- File attachments
- Comments or activity feeds
- Calendar integrations
- Billing or subscription plans
- Organization-level tenant management
- Public project links
- Time tracking
- Native mobile apps

These are intentionally outside the first production scope so the current system stays focused on project, member, and task management.

## Extension Paths

The current architecture leaves room for later additions:

- Add notifications by introducing event records for task and membership changes.
- Add comments through a task comment model related to users and tasks.
- Add organizations by placing projects under a tenant table and scoping memberships accordingly.
- Add audit history by recording role changes, task transitions, and project setting changes.
- Add file attachments through object storage with project/task-level authorization checks.

Any extension should preserve the existing principle: project membership and role capability determine what a user can see or change.
