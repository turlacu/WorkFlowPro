# User Role Permissions

WorkFlow Pro has four user types. This matrix describes the permissions currently enforced by the application.

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
| Manage the team schedule in the application | Yes | No | No | No |
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

## Conditional permissions

- A **Contributor** may edit and change the status of assignments they created. They cannot edit assignments created by someone else or delete assignments.
- An **Operator** may change the status of work assigned to them. They may also claim a pending, unassigned assignment by starting it, but cannot complete unassigned work without first claiming it.
- Only an **Administrator** may reverse progress by returning started work to pending or reopening completed work through the application.
- The server accepts team-schedule updates from Administrators and Producers, but the schedule-management interface is currently restricted to Administrators. The matrix therefore records the user-facing capability as Administrator-only.
- Administrators use the organization-wide statistics dashboard; the personal statistics tab is shown to the other three roles.
- Administrators cannot delete their own account or reset their own password through user management. They must change their own password from Settings.

## Role summaries

- **Administrator:** Manages the entire system, including assignments, users, schedules, configuration, statistics, and backups.
- **Producer:** Creates and manages any assignment, including reassignment and deletion, and monitors team activity.
- **Contributor:** Creates assignments and manages only the assignments they created.
- **Operator:** Performs assigned work, claims available unassigned work, reports progress, comments, and receives assignment notifications.
