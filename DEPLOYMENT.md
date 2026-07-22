# WorkFlowPro deployment (Coolify + Cloudflare Tunnel)

The production stack is defined in `docker-compose.coolify.yml`. It runs the app, PostgreSQL,
private MinIO object storage, and a one-shot Prisma migration service. The server's existing
Cloudflare connector reaches the app through Coolify's HTTPS proxy; PostgreSQL and MinIO have no
host ports.

## 1. Prepare secrets

Generate independent values on your workstation or server:

```bash
openssl rand -hex 32       # POSTGRES_PASSWORD
openssl rand -base64 48    # NEXTAUTH_SECRET
openssl rand -hex 20       # MINIO_ROOT_USER
openssl rand -hex 32       # MINIO_ROOT_PASSWORD
```

If the PostgreSQL password contains URL-reserved characters, URL-encode it in `DATABASE_URL`.

## 2. Configure the existing Cloudflare tunnel

1. Reuse the Cloudflare connector already installed on the Coolify server. Do not run a second
   `cloudflared` container in this application stack.
2. Add one published application with hostname `worksmart.turlacu.ro`, service type `HTTPS`, and
   service URL `https://127.0.0.1:443`.
3. Enable **No TLS Verify** for this origin, matching the server's other Coolify routes.
4. Do not publish ports 3000, 5432, 9000, or 9001 from the server firewall.

## 3. Create the Coolify resource

1. Create a project and add a **Docker Compose** resource from the Git repository.
2. Select `docker-compose.coolify.yml` as the Compose file.
3. Add these environment variables. Mark all secrets as secret values:

```env
POSTGRES_DB=workflowpro
POSTGRES_USER=workflowpro
POSTGRES_PASSWORD=<random value>
DATABASE_URL=postgresql://workflowpro:<URL-encoded password>@database:5432/workflowpro

NEXTAUTH_URL=https://worksmart.turlacu.ro
NEXTAUTH_SECRET=<random value>
INITIAL_ADMIN_EMAIL=<your administrator email>
INITIAL_ADMIN_PASSWORD=<random password of at least 12 characters>

MINIO_ROOT_USER=<random value>
MINIO_ROOT_PASSWORD=<random value>
MINIO_BUCKET_NAME=workflowpro-storage
```

Keep secret variables runtime-only. The Coolify Compose file deliberately uses empty build-time
fallbacks for them because Coolify evaluates Compose with its build-time environment before it
loads the runtime environment. The services will not start successfully if the runtime values are
actually missing.

4. In Coolify's **Domains for app** field, set `https://worksmart.turlacu.ro:3000` and save. Leave
   the domain fields for database, MinIO, migrate, and bootstrap empty.
5. Deploy. The `migrate` and safe one-shot `bootstrap` services must finish successfully before
   `app` starts. Do not add `prisma db push`, database reset, or unconditional seed commands to
   the application startup sequence.
6. Confirm the Cloudflare tunnel is **Healthy**, then check
   `https://worksmart.turlacu.ro/api/health`. It should report both database and object storage
   as healthy.

## 4. Create the first administrator

On the first deployment, the one-shot `bootstrap` service creates the administrator supplied by
`INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. It never updates or deletes an existing user.
After the first successful login:

1. Change the temporary password on the forced Security settings screen.
2. Remove `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` from Coolify.
3. Redeploy once; the bootstrap step will safely do nothing when those variables are absent.

For deliberate administrator recovery from a development checkout that can reach the production
database, use `npm run admin:create -- --email=you@example.com`. That recovery command resets the
named account, requires a password change, and invalidates its existing sessions.

## 5. Verify and operate

- Login: `https://worksmart.turlacu.ro/login`
- Dependency health: `https://worksmart.turlacu.ro/api/health`
- Liveness: `https://worksmart.turlacu.ro/api/healthz`
- Confirm assignment create/update/complete, schedule PDF upload/view, Excel preview/import, and
  backup download on a non-production test record.
- Back up both named volumes (`workflowpro-postgres` and `workflowpro-minio`) at the server level.
  The in-app JSON backup is useful for logical recovery but is not a substitute for volume or
  off-server backups.
- Before upgrades, take backups, deploy the new image, and verify the one-shot migration service
  completed. Never roll the database schema backward with `prisma migrate reset`.
