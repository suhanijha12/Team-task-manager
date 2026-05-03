# ProjektPilot Product Requirements Document

**Version:** 2.0
**Date:** May 3, 2026
**Author:** Suhani Jha

## 1. Overview

ProjektPilot is a team project and task management application for small teams that need a structured workspace for planning, assigning, tracking, and reviewing work. The product gives users authenticated access to project workspaces, member roles, task boards, dashboards, and administration tools in one full-stack Next.js application.

The current product scope is focused on collaborative project execution. Users can create projects, add members who already have accounts, assign role-based access, create tasks, assign owners, update status and priority, and track progress through dashboard and task-management views.

ProjektPilot is not a generic chat, document, file-sharing, or enterprise portfolio-management system. Its core responsibility is to keep projects, members, and tasks organized with clear access controls.

## 2. Goals

- Give teams a single place to manage project work and project access.
- Make task ownership, status, priority, and deadlines visible.
- Support both global task management and project-specific task management.
- Keep project permissions explicit through a role model.
- Provide a production-ready baseline with server-side auth, validation, database migrations, and deployable architecture.

## 3. Target Users

| User type | What they use ProjektPilot for |
|---|---|
| Team lead | Creates projects, adds members, assigns work, and monitors progress |
| Project owner | Manages project settings, access, and task execution |
| Co-owner | Helps administer project members and project tasks |
| Contributor | Creates and updates assigned or owned tasks |
| Viewer | Follows project progress without changing project data |

## 4. Current Product Capabilities

### 4.1 Authentication

Users can sign up, log in, log out, and access protected app pages through a JWT session stored in an httpOnly cookie.

Current behavior:

- Signup requires name, email, password, and optional confirm password.
- Email addresses are normalized and must be unique.
- Passwords must be at least 8 characters and include an uppercase letter and a number.
- Password hashes are stored with bcrypt.
- Authenticated users are redirected away from login/signup pages.
- Unauthenticated users are redirected to login for protected app routes.

Out of scope for the current version:

- Password reset
- Email verification
- Social login
- Token refresh flows

### 4.2 Project Management

Users can create projects and become the initial project administrator. Project records include:

- Name
- Description
- Optional deadline
- Creator
- Members
- Tasks

Users can view:

- A project list across accessible projects
- A project detail dashboard
- Project members
- Project tasks
- Project settings when their role permits it

Project creation and detail views are dashboard-oriented. Large creation and edit forms should not dominate the main project page.

### 4.3 Member and Role Management

Project access is controlled by `ProjectMember` records. A user only has project access when they have membership for that project.

Supported roles:

| Role | Scope |
|---|---|
| `VIEWER` | Read-only project and task visibility |
| `MEMBER` | Basic task participation and legacy-compatible contributor access |
| `EDITOR` | Active task creation and contribution |
| `CO_OWNER` | Project people/settings management and task administration |
| `ADMIN` | Full project control |

Role rules:

- `ADMIN` and `CO_OWNER` can manage project people and settings.
- `ADMIN`, `CO_OWNER`, `EDITOR`, and `MEMBER` can create project tasks.
- `VIEWER` can inspect project work but should not mutate it.
- A project must retain at least one `ADMIN` or `CO_OWNER`-level member before removing or demoting elevated access.

### 4.4 Task Management

Tasks are the core execution unit inside a project. A task includes:

- Title
- Description
- Status
- Priority
- Optional due date
- Optional assignee
- Creator
- Project relationship

Supported statuses:

`TODO` -> `IN_PROGRESS` -> `UNDER_REVIEW` -> `COMPLETED`

Supported priorities:

`LOW`, `MEDIUM`, `HIGH`

Users can:

- Create tasks inside writable projects.
- Assign tasks to project members.
- Leave tasks unassigned.
- Update task status, priority, due date, assignee, title, and description when permitted.
- Drag tasks between statuses in the project task board.
- Delete tasks when they have elevated project access.

Task edit rules:

- Elevated roles can administer all tasks in the project.
- Non-elevated contributors can edit tasks they created or are assigned to.
- Assignees must be members of the project.

### 4.5 Search, Filters, and Views

ProjektPilot supports task scanning through:

- Global task view across accessible projects
- Project-specific task view
- Kanban board
- List view
- Search query
- Status filter
- Priority filter
- Project filter when viewing global tasks

### 4.6 Dashboards and Admin Surface

The app provides authenticated dashboards for operational visibility:

- Dashboard page for high-level project and task activity
- Project dashboard for project-specific members and work
- Global tasks page for cross-project work management
- Admin page for people and project-role administration

The admin surface is intended for workspace and project access management, not system billing or tenant administration.

## 5. Current Application Surfaces

| Surface | Route |
|---|---|
| Home redirect | `/` |
| Login | `/login` |
| Signup | `/signup` |
| Dashboard | `/dashboard` |
| Projects list | `/projects` |
| New project | `/projects/new` |
| Project detail | `/projects/[projectId]` |
| Project settings | `/projects/[projectId]/settings` |
| Global tasks | `/tasks` |
| Admin | `/admin` |

## 6. API Scope

The backend is implemented with Next.js Route Handlers under `app/api/**/route.ts`.

### Auth

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Register user and set session cookie |
| `POST` | `/api/auth/login` | Authenticate user and set session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Return current authenticated user |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/dashboard` | Return aggregate project/task stats for the user |

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/projects` | List accessible projects |
| `POST` | `/api/projects` | Create a project and creator admin membership |
| `GET` | `/api/projects/[projectId]` | Get project detail for a member |
| `PUT` | `/api/projects/[projectId]` | Update project settings for elevated roles |
| `DELETE` | `/api/projects/[projectId]` | Delete project for elevated roles |

### Project Members

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/projects/[projectId]/members` | List members for a project member |
| `POST` | `/api/projects/[projectId]/members` | Add an existing user by email |
| `PUT` | `/api/projects/[projectId]/members/[userId]` | Update a member role |
| `DELETE` | `/api/projects/[projectId]/members/[userId]` | Remove a member |

### Tasks

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/projects/[projectId]/tasks` | List project tasks with filters and pagination |
| `POST` | `/api/projects/[projectId]/tasks` | Create a task in a writable project |
| `PATCH` | `/api/projects/[projectId]/tasks/[taskId]` | Update task status from the project board |
| `GET` | `/api/tasks/[taskId]` | Get task detail for a project member |
| `PUT` | `/api/tasks/[taskId]` | Update task fields |
| `DELETE` | `/api/tasks/[taskId]` | Delete a task for elevated roles |

## 7. Data Model Scope

Core entities:

- `User`
- `Project`
- `ProjectMember`
- `Task`

Core enums:

- `ProjectRole`: `ADMIN`, `MEMBER`, `CO_OWNER`, `EDITOR`, `VIEWER`
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`

See `prisma/schema.prisma` for the executable schema and `docs/technical-architecture.md` for implementation details.

## 8. Out of Scope

The current version does not include:

- Password reset or email verification
- Email invites or notification delivery
- Comments, activity feeds, or audit logs
- File attachments
- Calendar integrations
- Time tracking
- Billing or subscriptions
- Organization-level tenant management
- Public project links
- Native mobile apps

## 9. Success Criteria

- Users can authenticate and access only their permitted project data.
- Project owners can manage projects, members, and roles.
- Contributors can create and update permitted task work.
- Viewers can inspect project work without mutation access.
- The dashboard and task surfaces provide useful visibility across projects.
- Production builds pass with committed Prisma migrations and environment-based configuration.
