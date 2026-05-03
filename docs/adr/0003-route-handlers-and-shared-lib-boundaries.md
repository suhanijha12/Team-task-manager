# ADR 0003: Keep Route Handlers Thin with Shared Auth, Validation, and Permission Modules

**Status:** Accepted
**Date:** May 3, 2026

## Context

ProjektPilot exposes multiple API endpoints for auth, dashboards, projects, members, and tasks. These endpoints share repeated concerns:

- Resolve the current user.
- Validate route params and request bodies.
- Check project membership and role permissions.
- Validate cross-record invariants.
- Return consistent JSON errors.

If each route owns that logic independently, behavior will drift and permission bugs become more likely.

## Decision

Keep Route Handlers as thin orchestration layers and place shared logic in `lib/`.

Current module ownership:

- `lib/auth.ts` owns session cookies, JWT verification, and `requireUser()`.
- `lib/db.ts` owns the Prisma client singleton.
- `lib/errors.ts` owns API success/error response helpers.
- `lib/permissions.ts` owns project and task authorization rules.
- `lib/validators.ts` owns Zod schemas for params, query strings, and request bodies.
- `lib/serializers.ts` owns data serialization helpers.

Route handlers should follow this sequence:

1. Authenticate where required.
2. Parse params/body/query with validators.
3. Check permission helpers.
4. Run the Prisma read or mutation.
5. Return through shared response helpers.

## Consequences

Positive:

- Auth and permission behavior stays consistent across endpoints.
- Route files remain readable and easy to review.
- Validation rules are reusable by forms and APIs.
- Error handling stays predictable for the UI.

Tradeoffs:

- Shared modules must be kept well-scoped and not become catch-all utility files.
- Adding a new workflow often requires touching both a route handler and the relevant shared module.
- Permission helper names must stay accurate as product roles evolve.

## Current Implementation Notes

The current API surface follows this boundary for:

- `/api/auth/**`
- `/api/dashboard`
- `/api/projects`
- `/api/projects/[projectId]`
- `/api/projects/[projectId]/members`
- `/api/projects/[projectId]/tasks`
- `/api/tasks/[taskId]`
