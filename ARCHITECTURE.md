# SAM architecture

The UI remains local-first today, backed by Dexie. Domain types in
`src/types/sam.ts` do not import persistence or authentication packages.
Application code should depend on `SamRepository`, not Dexie tables.

## Ownership and authorization

Every durable entity has a `workspaceId` and audit timestamps. The version 3
Dexie migration assigns existing records to `local-default`, preserving current
offline installations. The role model is `owner`, `admin`, `planner`, and
`viewer`; it is intentionally defined independently of Clerk.

Clerk should identify the user. A Convex mutation must resolve that user to a
workspace membership server-side before it reads or writes any entity. Browser
provided workspace IDs are only routing hints, never authorization.

## Future Convex migration

Implement `SamRepository` in `src/infrastructure/convex`. The adapter converts
between the legacy numeric local IDs and opaque Convex document IDs at that
boundary. Keep compound indexes for workspace + foreign key and enforce a
unique allocation for `(workspaceId, assignmentId, month)`.

Dexie can then be retained as an offline cache/outbox. Convex remains the
authoritative source, while subscriptions hydrate the local cache and queued
mutations are replayed after reconnecting.
