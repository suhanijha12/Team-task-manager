# ADR 0001: Use Next.js App Router with Neon Postgres

**Status:** Accepted
**Date:** May 2, 2026

## Context

ProjektPilot needs a production-ready full-stack implementation for project and task management. The application requires authenticated pages, JSON API endpoints, role-based access control, relational project membership data, and a deployment path that keeps operational overhead low.

The selected stack must support both frontend and backend code in one codebase and use Neon Postgres for the database.

## Decision

Use a single Next.js App Router application for both frontend and backend:

- Render application pages with Next.js App Router.
- Implement backend endpoints with Route Handlers under `app/api/**/route.ts`.
- Use Server Components for authenticated read-heavy pages where practical.
- Use Client Components for interactive forms, filters, and task board interactions.
- Use Neon Postgres as the hosted relational database.
- Use Prisma ORM for schema management, type-safe data access, and migrations.
- Store auth sessions as JWTs in secure httpOnly cookies.

## Consequences

### Positive

- One deployable application instead of separate frontend and backend services.
- Route Handlers keep API behavior close to the app while preserving HTTP boundaries.
- Postgres models project membership and task ownership with proper foreign keys and constraints.
- Prisma migrations provide a repeatable database change workflow.
- Neon supports separate development and production branches and serverless-friendly connection pooling.

### Negative

- Long-running background jobs are not a natural fit for the web app runtime.
- Prisma migrations require a direct database URL, separate from pooled runtime access.
- Backend logic must stay carefully organized in `lib/` modules to avoid route handlers becoming too large.

## Operational Notes

- Use `DATABASE_URL` for pooled runtime queries.
- Use `DIRECT_URL` for migrations.
- Run `npx prisma migrate deploy` before production traffic uses a new schema.
- Keep auth cookie handling centralized in `lib/auth.ts`.
- Keep role checks centralized in `lib/permissions.ts`.
