# Database management

Production schema changes are applied only with committed Prisma migrations:

```bash
npm run db:migrate
```

The Coolify stack runs the same `prisma migrate deploy` command in a one-shot service before the
application starts. Do not use `prisma db push`, `migrate reset`, or table-clearing scripts against
production.

There are no default users or passwords. The first-deployment bootstrap is optional, creates only
a missing administrator, and never modifies existing data. For deliberate account recovery from
a trusted checkout with database access:

```bash
npm run admin:create -- --email=you@example.com
```

This generates a random temporary password, invalidates that account's sessions, and requires a
password change.

Before migrations or major releases, back up both PostgreSQL and MinIO volumes. Verify restores in
an isolated environment. The in-app JSON export is transactional and useful for logical recovery,
but it does not contain passwords, sessions, or the actual PDF objects and is not a complete server
backup.
