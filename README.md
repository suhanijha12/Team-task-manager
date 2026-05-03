# ProjektPilot

A team project management app built with Next.js. Create projects, manage tasks, assign work, and control access with role-based permissions.

## Tech Stack

- **Framework** — Next.js 16 (App Router, React 19, TypeScript)
- **Database** — PostgreSQL (Neon) via Prisma ORM
- **Auth** — JWT sessions in httpOnly cookies (`jose`, `bcryptjs`)
- **UI** — Tailwind CSS, Radix UI primitives, Lucide icons, Sonner toasts
- **Validation** — Zod

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
