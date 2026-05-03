# Team Task Manager - Implementation Plan

**Estimated total:** 8-12 hours
**Approach:** Single Next.js app, database first, then authenticated app flows, then deploy

---

## Phase 1: Next.js App Setup (1 hour)

### 1.1 Project Init
- [ ] Create a Next.js App Router project with TypeScript
- [ ] Install dependencies: next, react, react-dom, prisma, @prisma/client, zod, bcrypt, jsonwebtoken, tailwindcss, lucide-react, sonner
- [ ] Configure Tailwind CSS
- [ ] Add `.env.example`, `.gitignore`, and base scripts
- [ ] Create app route groups: `(auth)` and `(app)`

### 1.2 Shared Foundation
- [ ] Create `lib/db.ts` Prisma client singleton
- [ ] Create `lib/auth.ts` for JWT cookie helpers and current-user lookup
- [ ] Create `lib/errors.ts` for consistent API errors
- [ ] Create `lib/validators.ts` for Zod schemas
- [ ] Create `middleware.ts` to protect app routes

---

## Phase 2: Neon Postgres & Prisma (1-1.5 hours)

### 2.1 Database Setup
- [ ] Create a Neon project
- [ ] Create separate development and production branches
- [ ] Add `DATABASE_URL` for pooled runtime access
- [ ] Add `DIRECT_URL` for migrations
- [ ] Initialize Prisma with PostgreSQL provider

### 2.2 Schema & Migrations
- [ ] Define User, Project, ProjectMember, and Task models
- [ ] Define enums for project role, task status, and task priority
- [ ] Add unique constraints and indexes
- [ ] Run `npx prisma migrate dev`
- [ ] Generate Prisma client

### 2.3 Seed Data
- [ ] Create `prisma/seed.ts`
- [ ] Seed admin user: admin@demo.com / Password123
- [ ] Seed member user: member@demo.com / Password123
- [ ] Seed 2-3 projects with varied task statuses

---

## Phase 3: Backend Routes (2-3 hours)

### 3.1 Auth Routes
- [ ] `POST /api/auth/signup`
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/auth/me`
- [ ] Set secure httpOnly cookie on login/signup
- [ ] Clear cookie on logout

### 3.2 Project Routes
- [ ] `POST /api/projects`
- [ ] `GET /api/projects`
- [ ] `GET /api/projects/[projectId]`
- [ ] `PUT /api/projects/[projectId]`
- [ ] `DELETE /api/projects/[projectId]`
- [ ] Auto-create creator as ADMIN in a transaction
- [ ] List projects through ProjectMember membership

### 3.3 Member Routes
- [ ] `POST /api/projects/[projectId]/members`
- [ ] `GET /api/projects/[projectId]/members`
- [ ] `PUT /api/projects/[projectId]/members/[userId]`
- [ ] `DELETE /api/projects/[projectId]/members/[userId]`
- [ ] Validate member user exists by email
- [ ] Validate last admin cannot be removed or demoted

### 3.4 Task Routes
- [ ] `POST /api/projects/[projectId]/tasks`
- [ ] `GET /api/projects/[projectId]/tasks`
- [ ] `GET /api/tasks/[taskId]`
- [ ] `PUT /api/tasks/[taskId]`
- [ ] `DELETE /api/tasks/[taskId]`
- [ ] Validate assignee belongs to the project
- [ ] Enforce member/admin edit and delete permissions
- [ ] Add filtering, sorting, and pagination

### 3.5 Dashboard Route
- [ ] `GET /api/dashboard`
- [ ] Aggregate task counts by status
- [ ] Query overdue tasks
- [ ] Return role-aware project summaries

---

## Phase 4: Frontend Build (3-4 hours)

### 4.1 Auth Pages
- [ ] Login page with form validation
- [ ] Signup page with form validation
- [ ] Logout action
- [ ] Redirect authenticated users away from auth pages
- [ ] Redirect unauthenticated users from app pages to `/login`

### 4.2 App Layout
- [ ] App shell with navbar, sidebar, and responsive layout
- [ ] User menu with logout
- [ ] Mobile navigation
- [ ] Loading and error boundaries where useful

### 4.3 Dashboard Page
- [ ] Server-render dashboard summary cards
- [ ] Overdue tasks list with links
- [ ] Project quick-links
- [ ] Role-aware data display

### 4.4 Project Pages
- [ ] Projects list page
- [ ] Create project page
- [ ] Project detail page with task board
- [ ] Project settings page for admins
- [ ] Member management controls

### 4.5 Task Management
- [ ] Task board columns by status
- [ ] Task card with priority and assignee
- [ ] Create/edit task form
- [ ] Status change control
- [ ] Filter bar for status, priority, assignee, and due date
- [ ] Overdue visual indicator

### 4.6 Polish
- [ ] Loading states
- [ ] Empty states
- [ ] Toast notifications
- [ ] Field-level form errors
- [ ] Mobile responsiveness check

---

## Phase 5: Integration & Testing (1-2 hours)

### 5.1 Automated Checks
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Prisma migration validation against a Neon development branch

### 5.2 Manual Flow Testing
- [ ] Signup -> dashboard
- [ ] Login -> dashboard
- [ ] Create project -> creator becomes admin
- [ ] Add member by email
- [ ] Create task -> assign member -> change status
- [ ] Verify member restrictions
- [ ] Verify admin-only project settings
- [ ] Verify overdue dashboard logic

### 5.3 Edge Cases
- [ ] Duplicate email
- [ ] Invalid credentials
- [ ] Invalid or missing auth cookie
- [ ] Duplicate project membership
- [ ] Removing or demoting the last admin
- [ ] Assigning task to non-member

---

## Phase 6: Deployment (1 hour)

### 6.1 Production Prep
- [ ] Create Neon production branch/database
- [ ] Set Vercel environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NODE_ENV`
- [ ] Run `npx prisma migrate deploy` for production
- [ ] Build app with `npm run build`

### 6.2 Vercel Deploy
- [ ] Connect GitHub repo to Vercel
- [ ] Confirm framework preset is Next.js
- [ ] Configure build command: `npm run build`
- [ ] Configure install command: `npm install`
- [ ] Verify deployment is live and functional
- [ ] Test all flows on live URL

### 6.3 Submission Package
- [ ] Live URL
- [ ] GitHub repo
- [ ] README with stack, setup instructions, env vars, API docs, and demo credentials
- [ ] 2-5 minute demo video showing all core features

---

## README Template Outline

```markdown
# Team Task Manager

Full-stack project management app with role-based access control.

## Live Demo
[Vercel URL]

## Demo Credentials
- Admin: admin@demo.com / Password123
- Member: member@demo.com / Password123

## Tech Stack
- App: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers and Server Actions
- Database: Neon Postgres
- ORM: Prisma
- Auth: JWT in secure httpOnly cookies + bcrypt
- Deployment: Vercel

## Features
- User authentication
- Project creation and team management
- Task creation, assignment, and status tracking
- Role-based access
- Dashboard with task analytics and overdue tracking

## Local Setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in values
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run dev`

## Environment Variables
| Variable | Description |
|----------|-------------|
| DATABASE_URL | Neon pooled Postgres connection string for runtime queries |
| DIRECT_URL | Neon direct Postgres connection string for migrations |
| JWT_SECRET | Secret key for JWT signing |
| NODE_ENV | production or development |

## API Documentation
[Brief table of endpoints]
```
