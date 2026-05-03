# Team Task Manager - Technical Architecture Document

**Version:** 1.1
**Date:** May 2, 2026

---

## 1. Tech Stack

### Application
- **Framework:** Next.js App Router with TypeScript
- **Frontend:** React Server Components by default, Client Components only for interactive UI
- **Backend:** Next.js Route Handlers under `app/api/**/route.ts`
- **Server mutations:** Server Actions where the caller is a trusted app form; Route Handlers for public JSON API endpoints
- **Validation:** Zod schemas shared by route handlers and form actions
- **Auth:** JWT in secure httpOnly cookies, bcrypt for password hashing
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Toasts/Notifications:** Sonner or react-hot-toast

### Database
- **Database:** Neon Postgres
- **ORM:** Prisma ORM with generated TypeScript client
- **Migrations:** Prisma Migrate committed in `prisma/migrations`
- **Connection variables:** `DATABASE_URL` for pooled runtime queries and `DIRECT_URL` for migrations

### Deployment
- **Platform:** Vercel recommended for the Next.js app
- **Database host:** Neon
- **Structure:** Single Next.js application

---

## 2. Project Structure

```
team-task-manager/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/new/page.tsx
│   │   ├── projects/[projectId]/page.tsx
│   │   └── projects/[projectId]/settings/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── projects/route.ts
│   │   ├── projects/[projectId]/route.ts
│   │   ├── projects/[projectId]/members/route.ts
│   │   ├── projects/[projectId]/members/[userId]/route.ts
│   │   ├── projects/[projectId]/tasks/route.ts
│   │   └── tasks/[taskId]/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   └── overdue-list.tsx
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── navbar.tsx
│   │   └── sidebar.tsx
│   ├── projects/
│   │   ├── member-manager.tsx
│   │   ├── project-card.tsx
│   │   └── project-form.tsx
│   └── tasks/
│       ├── task-board.tsx
│       ├── task-card.tsx
│       ├── task-filters.tsx
│       └── task-form.tsx
├── lib/
│   ├── auth.ts                  # JWT cookie helpers and current-user lookup
│   ├── db.ts                    # Prisma client singleton
│   ├── errors.ts                # API error helpers
│   ├── permissions.ts           # project membership and role checks
│   └── validators.ts            # Zod schemas
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── middleware.ts                # route protection for app pages
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Database Schema (Postgres)

### Prisma Model Outline

```prisma
enum ProjectRole {
  ADMIN
  MEMBER
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

model User {
  id           String          @id @default(uuid()) @db.Uuid
  name         String          @db.VarChar(50)
  email        String          @unique @db.VarChar(255)
  passwordHash String          @map("password_hash")
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  projectsMade Project[]       @relation("ProjectCreator")
  memberships  ProjectMember[]
  tasksMade     Task[]          @relation("TaskCreator")
  assignedTasks Task[]          @relation("TaskAssignee")

  @@map("users")
}

model Project {
  id          String          @id @default(uuid()) @db.Uuid
  name        String          @db.VarChar(100)
  description String          @default("") @db.VarChar(500)
  deadline    DateTime?
  createdById String          @map("created_by_id") @db.Uuid
  createdBy   User            @relation("ProjectCreator", fields: [createdById], references: [id])
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")
  members     ProjectMember[]
  tasks       Task[]

  @@index([createdById])
  @@map("projects")
}

model ProjectMember {
  id        String      @id @default(uuid()) @db.Uuid
  projectId String      @map("project_id") @db.Uuid
  userId    String      @map("user_id") @db.Uuid
  role      ProjectRole
  joinedAt  DateTime    @default(now()) @map("joined_at")
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
  @@map("project_members")
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  title       String       @db.VarChar(200)
  description String       @default("") @db.VarChar(2000)
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?    @map("due_date")
  projectId   String       @map("project_id") @db.Uuid
  assigneeId  String?      @map("assignee_id") @db.Uuid
  createdById String       @map("created_by_id") @db.Uuid
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdBy   User         @relation("TaskCreator", fields: [createdById], references: [id])

  @@index([projectId, status])
  @@index([assigneeId])
  @@index([dueDate])
  @@map("tasks")
}
```

---

## 4. Auth Flow

```
[Signup]
Client -> POST /api/auth/signup { name, email, password }
Route Handler -> Validate -> Hash password -> Create user -> Set httpOnly JWT cookie -> Return { user }

[Login]
Client -> POST /api/auth/login { email, password }
Route Handler -> Validate -> Compare hash -> Set httpOnly JWT cookie -> Return { user }

[Protected App Page]
Browser -> /dashboard
middleware.ts -> Verify cookie token -> Continue or redirect to /login

[Protected API Request]
Client -> GET /api/projects
Route Handler -> getCurrentUser() -> Query authorized records -> Return JSON
```

**JWT payload:**

```json
{ "userId": "...", "email": "..." }
```

**Token storage:** secure httpOnly cookie with `sameSite=lax`. Use `secure=true` in production.

---

## 5. Backend Boundaries

### Route Handler Pattern

Each route handler should:
- Read and validate request input with Zod
- Resolve the current user from the auth cookie
- Run permission checks before database writes
- Use Prisma transactions for multi-step writes
- Return a consistent JSON response and status code

### Permission Helpers

```
requireUser()
  -> verifies cookie JWT
  -> loads the user from Postgres
  -> throws 401 when missing or invalid

requireProjectMember(projectId, userId)
  -> loads ProjectMember
  -> throws 403 when user is not in project

requireProjectAdmin(projectId, userId)
  -> loads ProjectMember with role ADMIN
  -> throws 403 when user is not an admin
```

### Mutations Requiring Transactions

- Project creation plus creator admin membership
- Member role updates that must preserve at least one admin
- Member removal that must preserve at least one admin
- Task creation with assignee membership validation

---

## 6. Deployment Strategy

### Vercel + Neon

**Build command:**

```bash
npm run build
```

**Production start command:**

```bash
npm start
```

**Migration command:**

```bash
npx prisma migrate deploy
```

Run migrations before or during deployment using a CI step with `DIRECT_URL` available.

### Environment Variables

```
DATABASE_URL=postgresql://...neon.tech/...?...pooler...
DIRECT_URL=postgresql://...neon.tech/...
JWT_SECRET=<random-32-byte-secret>
NODE_ENV=production
```

### Local Development

```bash
npm install
npx prisma migrate dev
npm run dev
```

Use a Neon development branch or a local Postgres database for local development. Keep production and development connection strings separate.

---

## 7. Key Implementation Notes

### Data Fetching
- Fetch private dashboard and project data in Server Components where possible.
- Use Route Handlers for client-side interactions that need JSON responses.
- Mark user-specific data as dynamic; do not cache authenticated database responses globally.

### Password Hashing
- Use bcrypt with salt rounds = 10 or higher.
- Store only `passwordHash`.
- Never return password hashes in API responses.

### Input Validation
- Trim all string inputs.
- Use Zod for body, params, and query validation.
- Return field-level validation details for forms.

### SQL Safety
- Use Prisma query APIs for normal reads and writes.
- Avoid raw SQL unless needed for a specific aggregate or migration.
- If raw SQL is necessary, use parameterized Prisma APIs only.

### Error Handling
- Use a small app error helper with `statusCode`, `code`, and safe public message.
- Map Prisma unique constraint errors to 409 responses.
- Map validation errors to 400 responses.
- Log unexpected errors server-side and return a generic 500 response.

### Performance
- Keep indexes on membership lookup, task status, assignee, and due date.
- Paginate task listings with a default page size of 20.
- Select only fields needed by the current view.
- Use aggregate queries for dashboard counts instead of loading all tasks.
