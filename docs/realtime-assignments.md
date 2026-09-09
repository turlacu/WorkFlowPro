# Assignment live updates

The assignment page opens one authenticated SSE connection to `/api/assignments/stream` for every role. Creation, edits, status changes, reassignment, deletion and comments publish small invalidation events through PostgreSQL `LISTEN/NOTIFY`. Backup restoration publishes a reset. Publication occurs inside the write transaction, so rollback emits no event. No migration or additional service is required.

Each application process maintains a shared database listener. Events refresh the current filtered list, calendar and workload summary after a 150 ms batching window. Dates and searches are preserved. Open details and comments refresh without discarding comment drafts; edit forms retain their existing values. Operator inbox notifications remain separate.

SSE reconnect, database listener reconnect, network recovery and tab visibility trigger resynchronization. A visible page also refreshes every 30 seconds to cover missed events. PostgreSQL notifications are not a durable event log. Writes made outside the application publishers are caught by this fallback. Background refresh failures retain the previous list instead of clearing the workspace. Normal event delivery should update visible data within two seconds, depending on network and database latency.

The stream checks session validity every 25 seconds and disables response buffering. Verify streaming through the deployment proxy after rollout: keep two users' assignment pages visible and create, start, complete and delete a task. Each action should appear on the other screen without navigation. Browser Network should show a pending `text/event-stream` response with regular heartbeat events.

## Regression tests

- `npm test` covers event payload validation and publication failure propagation.
- `npm run test:e2e -- tests/e2e/assignment-realtime.spec.ts` exercises the real UI with controlled API/stream fixtures, including reconnect, fallback and draft preservation. Set `NEXTAUTH_SECRET` to match the local test server.
- `tests/e2e/assignment-realtime-integration.spec.ts` requires an isolated local PostgreSQL database with migrations applied. Start the app using that database as `DATABASE_URL`, and set `REALTIME_TEST_DATABASE_URL` to the same URL. This test creates temporary users and tasks and intentionally terminates assignment listener connections to verify recovery; never target a shared development or production database.
- Set `PLAYWRIGHT_BASE_URL` and optionally `REALTIME_SECOND_APP_URL` to two running app instances sharing that isolated database to verify cross-process delivery. Run this integration test with `--project=desktop`. Test cookies use the server's `NEXTAUTH_SECRET`; use local HTTP URLs.

Deployment verification is distinct from the local tests: confirm event delivery and reconnect behavior through the actual Coolify proxy before considering production behavior verified.
