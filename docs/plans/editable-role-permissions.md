# Editable Role Permissions in the Admin Panel

## Summary

Replace hard-coded role authorization with a database-backed capability catalog. Administrators will manage permissions from a new **Permissions** tab, stage multiple changes, review them, and save the matrix atomically. Changes apply when affected users next sign in.

Roles remain fixed to Administrator, Producer, Contributor, and Operator; there are no custom roles, per-user overrides, or free-form permission names.

## Data and Authorization

- Add persisted role grants, a singleton policy revision, and an audit table containing actor, role, permission, enabled/disabled state, and timestamp.
- Seed grants matching current behavior:
  - Assignment viewing, creation, comments, deletion, status changes, ownership/assignee scopes, claiming unassigned work, and reversing status
  - Schedule viewing/management, Excel imports/configuration, and shift legends
  - User creation/editing/deletion/role assignment/password reset
  - Personal/organization statistics, backups, and notifications
- Keep profile viewing, own-password changes, authenticated presence, and the user directory fixed for every role.
- Keep `ROLE_PERMISSION_MANAGE` permanently granted exclusively to Administrators and prevent demotion of the last Administrator.
- Replace route and UI role checks with shared typed permission helpers. Ownership-based capabilities remain explicit (`EDIT_ANY`, `EDIT_OWN`, `TRANSITION_ANY`, `TRANSITION_OWN`, `TRANSITION_ASSIGNED`, `CLAIM_UNASSIGNED`) rather than hidden role rules.
- Retain role checks only for domain meaning, such as assignments being assignable to Operator accounts.
- Snapshot effective permissions into the signed JWT/session at login. Existing pre-deployment sessions fall back to the current default matrix; saved changes affect users after their next sign-in.
- Keep the Admin panel itself Administrator-only. Permissions granted to other roles for admin features can authorize API use but do not expose Admin-panel screens.

## Admin Interface and APIs

- Add `/dashboard/permissions` and a **Permissions** navigation item that remains available to Administrators.
- Present a restrained grouped matrix with permissions as rows and roles as columns:
  - Desktop: sticky permission labels with accessible checkboxes
  - Mobile: role selector followed by a vertical permission list
  - Locked cells explain protected or universal capabilities
- Stage edits locally, provide **Discard** and **Review changes** actions, show an exact confirmation summary, then save once.
- Show a notice that changes apply at next sign-in and a recent audit-history table below the editor.
- Add:
  - `GET /api/admin/role-permissions` → catalog, grants, locked capabilities, revision, and recent audit entries
  - `PUT /api/admin/role-permissions` with `{ revision, grants: Record<UserRole, PermissionKey[]> }`
- Validate all permission keys and roles, reject changes to protected capabilities, write grants and audit entries in one transaction, and return `409` when another administrator saved a newer revision.
- Hide or disable ordinary UI actions from the session’s permission snapshot while continuing to enforce every permission server-side.
- Update the permissions guide to describe the default matrix and explain that live configuration may differ.

## Backup and Compatibility

- Advance backups to schema version 5 and include the permission policy, grants, and audit history.
- Restore version-5 permissions only after validating protected invariants; older version 2–4 backups preserve the current permission configuration.
- Remap or null deleted audit actors while retaining actor-name/email snapshots.
- Make every role change invalidate that user’s current session so the next login receives the correct role policy.

## Test Plan

- Verify migration defaults reproduce every existing role permission and existing sessions receive legacy defaults.
- Unit-test permission resolution, scoped assignment access, protected capabilities, and JWT/session snapshots.
- Test unauthorized API access, non-Administrator panel denial, last-Administrator protection, tampered payloads, atomic audit writes, and revision conflicts.
- Confirm a saved grant does not affect an existing session but does apply after signing out and back in.
- Test desktop/mobile editing, keyboard accessibility, dirty-state discard, confirmation summaries, denied controls, and audit rendering.
- Test version-5 backup round trips and backward-compatible version 2–4 restores.
- Run type checking, linting, unit/security tests, and targeted Playwright authorization flows.

## Assumptions

- “Add/remove permissions” means assigning or revoking capabilities from the predefined enforceable catalog.
- Newly invented capabilities require a future code change and catalog addition.
- The explicitly chosen next-sign-in activation means revoked access remains usable by an existing session until that user signs in again.
