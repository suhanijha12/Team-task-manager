# ADR 0002: Use Project Membership Roles as the Authorization Boundary

**Status:** Accepted
**Date:** May 3, 2026

## Context

ProjektPilot needs users to collaborate across multiple projects with different access levels per project. A user can own one project, contribute to another, and view a third. Authorization cannot be global to the user account.

The app also needs a role model that supports read-only visibility, task contribution, and delegated project administration.

## Decision

Use `ProjectMember` as the primary authorization boundary. A user can access a project only when a row exists for that user and project.

Use this `ProjectRole` enum:

- `ADMIN`
- `MEMBER`
- `CO_OWNER`
- `EDITOR`
- `VIEWER`

Centralize role checks in `lib/permissions.ts`.

Capability rules:

- `VIEWER` can read project and task data.
- `MEMBER` and `EDITOR` can create and update permitted task work.
- `CO_OWNER` and `ADMIN` can manage people, settings, and all tasks.
- At least one elevated project manager must remain before removing or demoting project administration access.

## Consequences

Positive:

- Authorization follows the project data model directly.
- Users can have different capabilities in different projects.
- Route handlers can call shared helpers instead of duplicating role logic.
- `CO_OWNER` allows delegated management without transferring original project ownership.
- `VIEWER` supports stakeholder visibility without edit access.

Tradeoffs:

- Every project and task route must resolve membership before returning sensitive data.
- Role changes need guardrails so a project does not lose elevated management access.
- Legacy `MEMBER` behavior must stay compatible while `EDITOR` and `VIEWER` provide more explicit semantics.

## Current Implementation Notes

- `requireProjectMember` rejects users who are not project members.
- `requireProjectAdmin` currently means `ADMIN` or `CO_OWNER`.
- `canWriteProjectTasks` allows `ADMIN`, `CO_OWNER`, `EDITOR`, and `MEMBER`.
- `canEditTask` allows elevated users, task creators, and assignees.
- `assertAssigneeIsProjectMember` prevents assigning work outside the project.
