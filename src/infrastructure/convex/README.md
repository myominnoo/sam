# Convex and Clerk integration boundary

`SamRepository` is the sole persistence contract used by application services.
When Convex is configured, implement that contract here using generated Convex
types. Every query and mutation must obtain the Clerk identity server-side,
resolve workspace membership, and scope every document to that workspace.

Do not accept a trusted workspace ID from the browser. Enforce the roles in
`src/application/authorization.ts` in Convex mutations and queries.
