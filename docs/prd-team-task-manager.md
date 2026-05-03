# Team Task Manager — Product Requirements Document

**Version:** 1.1
**Date:** May 2, 2026
**Author:** Girish / Grafik Studio

---

## 1. Overview

Team Task Manager is a full-stack web application that allows users to create projects, assign tasks, and track progress with role-based access control (Admin/Member). The platform provides a clean dashboard for visibility into task statuses, overdue items, and team workload.

**Target deployment:** Vercel for the Next.js app, with Neon Postgres as the production database
**Timeline:** 1–2 days (8–12 hours of dev time)

---

## 2. User Roles & Permissions

### Admin
- Create, edit, delete projects
- Invite/remove team members from projects
- Create, assign, edit, delete any task within their projects
- Change member roles within a project
- View full dashboard with all project/task analytics
- Mark tasks as complete or change status

### Member
- View projects they belong to
- Create tasks within assigned projects
- Edit/update tasks assigned to them (status, notes)
- View dashboard filtered to their assignments
- Cannot delete projects or remove members
- Cannot edit tasks assigned to others (view only)

---

## 3. Core Features

### 3.1 Authentication (Signup/Login)

**Signup flow:**
- Fields: Full name, email, password, confirm password
- Email must be unique
- Password: minimum 8 characters, at least 1 uppercase, 1 number
- On signup, user is redirected to dashboard (auto-login)

**Login flow:**
- Fields: Email, password
- JWT-based authentication with a secure httpOnly cookie
- Token expiry: 7 days
- "Forgot password" is out of scope for v1

**Session management:**
- Protected routes redirect to /login if unauthenticated
- Token refresh is out of scope for v1

### 3.2 Project Management

**Create project:**
- Fields: Project name (required), description (optional), deadline (optional)
- Creator is automatically assigned as Admin of that project

**Project listing:**
- Card/list view showing project name, member count, task summary, deadline
- Filter: All projects / My projects

**Project detail view:**
- Overview: name, description, deadline, member list
- Task board (Kanban or list view)
- Settings tab (Admin only): edit project, manage members

**Add members to project:**
- Admin can invite by email (user must already have an account)
- Assign role: Admin or Member
- Members see the project in their dashboard immediately

### 3.3 Task Management

**Create task:**
- Fields: Title (required), description, assignee (dropdown of project members), priority (Low/Medium/High), due date, status (defaults to "To Do")
- Only project Admins and Members can create tasks

**Task statuses:**
- To Do → In Progress → Under Review → Completed
- Status transitions can happen in any direction (no enforced workflow)

**Task detail view:**
- Full details: title, description, assignee, priority, status, due date, created date, created by
- Edit inline or via modal
- Activity log (stretch goal — nice to have)

**Task assignment:**
- Dropdown of project members
- Assignee receives visual indicator on dashboard
- Unassigned tasks are allowed

**Task filtering & sorting:**
- Filter by: status, priority, assignee, due date
- Sort by: due date, priority, created date

### 3.4 Dashboard

**Global dashboard (after login):**
- Summary cards: Total tasks, To Do, In Progress, Under Review, Completed, Overdue
- Overdue tasks list (due date < today AND status ≠ Completed)
- Recent activity (last 10 task updates across all projects)
- Project quick-links

**Per-role view:**
- Admin sees all tasks across their projects
- Member sees only tasks assigned to them

---

## 4. Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Required |
| email | String | Unique, required |
| password | String | Hashed (bcrypt) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Project
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Required |
| description | String | Optional |
| deadline | DateTime | Optional |
| createdBy | FK → User | Required |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### ProjectMember (join table)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| projectId | FK → Project | Required |
| userId | FK → User | Required |
| role | Enum: ADMIN, MEMBER | Required |
| joinedAt | DateTime | Auto |

**Constraint:** Unique(projectId, userId)

### Task
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| title | String | Required |
| description | String | Optional |
| status | Enum: TODO, IN_PROGRESS, UNDER_REVIEW, COMPLETED | Default: TODO |
| priority | Enum: LOW, MEDIUM, HIGH | Default: MEDIUM |
| dueDate | DateTime | Optional |
| projectId | FK → Project | Required |
| assigneeId | FK → User | Nullable |
| createdBy | FK → User | Required |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

## 5. API Design

The backend is implemented with Next.js Route Handlers under `app/api/**/route.ts`. Authenticated app pages should fetch private data on the server where practical, and client-side interactions should call these JSON endpoints.

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register new user | Public |
| POST | /api/auth/login | Login, sets secure auth cookie | Public |
| POST | /api/auth/logout | Logout, clears auth cookie | Protected |
| GET | /api/auth/me | Get current user profile | Protected |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/projects | Create project | Protected |
| GET | /api/projects | List user's projects | Protected |
| GET | /api/projects/:id | Get project details | Protected (member) |
| PUT | /api/projects/:id | Update project | Protected (admin) |
| DELETE | /api/projects/:id | Delete project | Protected (admin) |

### Project Members
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/projects/:id/members | Add member | Protected (admin) |
| GET | /api/projects/:id/members | List members | Protected (member) |
| PUT | /api/projects/:id/members/:userId | Update role | Protected (admin) |
| DELETE | /api/projects/:id/members/:userId | Remove member | Protected (admin) |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/projects/:id/tasks | Create task | Protected (member) |
| GET | /api/projects/:id/tasks | List tasks (with filters) | Protected (member) |
| GET | /api/tasks/:id | Get task detail | Protected (member) |
| PUT | /api/tasks/:id | Update task | Protected (varies) |
| DELETE | /api/tasks/:id | Delete task | Protected (admin) |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/dashboard | Aggregated stats | Protected |

**Query params for task listing:**
- `status` — filter by status
- `priority` — filter by priority
- `assignee` — filter by assignee ID
- `sort` — field to sort by (dueDate, priority, createdAt)
- `order` — asc or desc

---

## 6. Validation Rules

### Auth
- **Email:** Valid format, trimmed, lowercase
- **Password:** Min 8 chars, 1 uppercase, 1 number
- **Name:** Min 2 chars, max 50 chars

### Project
- **Name:** Required, min 2 chars, max 100 chars
- **Description:** Max 500 chars
- **Deadline:** Must be a future date (on create)

### Task
- **Title:** Required, min 2 chars, max 200 chars
- **Description:** Max 2000 chars
- **Status:** Must be valid enum value
- **Priority:** Must be valid enum value
- **Assignee:** Must be a member of the project
- **Due date:** Optional, no past-date restriction (tasks can be retroactively logged)

---

## 7. Error Handling

Standard error response format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

**Error codes:**
- 400 — Validation error
- 401 — Unauthenticated
- 403 — Unauthorized (wrong role)
- 404 — Resource not found
- 409 — Conflict (duplicate email, already a member)
- 500 — Internal server error

---

## 8. Pages & Routes (Frontend)

| Route | Page | Auth |
|-------|------|------|
| /login | Login page | Public |
| /signup | Signup page | Public |
| /dashboard | Main dashboard | Protected |
| /projects | Projects list | Protected |
| /projects/new | Create project | Protected |
| /projects/:id | Project detail + task board | Protected |
| /projects/:id/settings | Project settings (admin) | Protected (admin) |

---

## 9. Non-Functional Requirements

- **Responsive:** Works on desktop and mobile
- **Performance:** API responses < 500ms for list endpoints
- **Security:** Passwords hashed with bcrypt, JWT stored in secure httpOnly cookies, input validation, parameterized database access
- **CORS:** Same-origin by default because frontend and backend run in the same Next.js app
- **Environment variables:** All secrets in `.env` (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, etc.)

---

## 10. Out of Scope (v1)

- Email notifications
- Forgot/reset password
- File attachments on tasks
- Comments on tasks
- Real-time updates (WebSocket)
- Activity/audit log
- User profile editing
- Task dependencies
- Recurring tasks
- Time tracking
