# ADR 0001: Use a Single Next.js App with Neon Postgres

**Status:** Accepted
**Date:** May 2, 2026
**Updated:** May 3, 2026

## Context

ProjektPilot needs a production-ready app for authenticated project management, task workflows, role-based access, dashboards, and JSON APIs. The project should stay operationally simple while still supporting real relational data and deployable production architecture.

The selected stack must support frontend and backend work in one codebase and use Postgres as the production database.

## Decision

Use one Next.js App Router application for the product.

- Render pages with Next.js App Router.
- Implement backend behavior with Route Handlers under `app/api/**/route.ts`.
- Use Server Components for authenticated read-heavy views where practical.
- Use Client Components for forms, filters, dialogs, theme toggles, and task board interactions.
- Use Neon Postgres as the hosted relational database.
- Use Prisma for schema definition, migrations, generated client access, and type-safe queries.
- Store authenticated sessions as JWTs in secure httpOnly cookies.
- Deploy the app as a single Vercel-compatible Next.js application.

## Consequences

Positive:

- One deployable application instead of separate frontend and API services.
- Route Handlers preserve HTTP boundaries without a separate backend project.
- Postgres models project membership, role checks, and task ownership with relational constraints.
- Prisma migrations make database changes repeatable and reviewable.
- Neon supports production Postgres without managing database infrastructure.

Tradeoffs:

- Long-running background jobs and async workers are outside this app shape.
- Prisma migrations need `DIRECT_URL`, separate from pooled runtime `DATABASE_URL`.
- Backend business logic must stay centralized in `lib/` so route handlers do not become large.
- App route protection and API authorization must both be maintained because client navigation protection is not enough.

## Current Implementation Notes

- `proxy.ts` protects configured app routes and redirects authenticated users away from auth pages.
- `lib/auth.ts` owns JWT cookie verification and current-user lookup.
- `lib/db.ts` owns Prisma client access.
- `prisma/schema.prisma` is the executable database schema.
- `docs/technical-architecture.md` is the current architecture reference.
