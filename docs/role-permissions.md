# User Role Permissions

WorkFlow Pro has four fixed user types. This matrix describes the default permissions. Administrators can change the grants in **Admin panel → Permissions**; users receive the updated policy at their next sign-in.

**Legend:** **Yes** = allowed, **Limited** = allowed only under the condition described below, **No** = not allowed.

| Permission | Administrator | Producer | Contributor | Operator |
| --- | :---: | :---: | :---: | :---: |
| View assignments and their details | Yes | Yes | Yes | Yes |
| Create assignments | Yes | Yes | Yes | No |
| Edit assignment details or reassign work | Yes | Yes | Limited | No |
| Start or complete assignments | Yes | Yes | Limited | Limited |
| Return started work to pending or reopen completed work | Yes | No | No | No |
| Delete assignments | Yes | Yes | No | No |
| Read and add assignment comments | Yes | Yes | Yes | Yes |
| View the team schedule | Yes | Yes | Yes | Yes |
| Manage the team schedule through the API | Yes | Yes | No | No |
| Import schedules from Excel | Yes | No | No | No |
| Manage Excel import configurations and shift color legends | Yes | No | No | No |
| Create users and change user roles | Yes | No | No | No |
| Edit or delete other users | Yes | No | No | No |
| Reset another user's password | Yes | No | No | No |
| View organization-wide statistics | Yes | No | No | No |
| View the activity log | Yes | No | No | No |
| View personal activity statistics | No | Yes | Yes | Yes |
| Create, download, delete, or restore backups | Yes | No | No | No |
| Receive assignment notifications | No | No | No | Yes |
| View personal profile information | Yes | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes | Yes |
| Manage role permissions | Yes | No | No | No |

Profile access, changing one's own password, authenticated presence, and the user directory are core permissions and cannot be removed. Managing role permissions is protected: it cannot be removed from Administrator or granted to another role. Roles and permission names are fixed; the application does not support custom roles or per-user exceptions.

## Conditional permissions

- A **Contributor** may edit and change the status of assignments they created. They cannot edit assignments created by someone else or delete assignments.
- An **Operator** may change the status of work assigned to them. They may also claim a pending, unassigned assignment by starting it, but cannot complete unassigned work without first claiming it.
- Only an **Administrator** may reverse progress by returning started work to pending or reopening completed work through the application.
- The Admin panel itself remains restricted to users whose role is Administrator. Individual API capabilities can still be granted to another role where the application exposes that action outside the Admin panel.
- Administrators use the organization-wide statistics dashboard; the personal statistics tab is shown to the other three roles.
- Administrators cannot delete their own account or reset their own password through user management. They must change their own password from Settings.

## Role summaries

- **Administrator:** Manages the entire system, including assignments, users, schedules, configuration, statistics, and backups.
- **Producer:** Creates and manages any assignment, including reassignment and deletion, and monitors team activity.
- **Contributor:** Creates assignments and manages only the assignments they created.
- **Operator:** Performs assigned work, claims available unassigned work, reports progress, comments, and receives assignment notifications.
