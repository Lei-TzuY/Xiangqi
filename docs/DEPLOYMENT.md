# Deployment

## Render staging

The root `render.yaml` defines two Singapore-region resources:

1. `xiangqi-mcp` — a Docker web service exposing `/mcp`, `/health`, and `/ready`.
2. `xiangqi-kv` — a private Render Key Value instance exposed to the web service as `REDIS_URL`.

Both are intentionally configured on Render's **Free** plan for staging so creating the Blueprint does not silently opt into paid infrastructure. Free Key Value is shared across service instances while it is running, but it does not persist to disk and can lose all game state when the Key Value instance restarts.

To create staging, connect this repository as a Render Blueprint and sync `render.yaml`. The web service health check should target `/ready`.

## Production upgrade

Before describing the deployment as production-durable:

- Upgrade `xiangqi-kv` from `free` to a paid Key Value plan (for example `256mb`).
- Use a persistent mode such as Render's default `journal-snapshot` for a paid instance.
- Keep the web service and Key Value in the same region so `REDIS_URL` uses Render's private network.
- Run hosted concurrency/load tests and verify game state survives a controlled web-service restart.
- Review Render logs for unexpected PII before public submission.

The application does not require a code change for this upgrade. `REDIS_URL` selects the shared store automatically.

## Health and operations

- `GET /health` is a dependency-free liveness check.
- `GET /ready` checks the selected game-store backend and returns `503` if shared storage is unavailable.
- `/mcp` is rate-limited per client IP. Configure the limit with `RATE_LIMIT_PER_MINUTE` (default `120`).
- Server logs are JSON lines suitable for Render log search.
- `SIGTERM` and `SIGINT` stop accepting connections, close the game store, and exit cleanly.

## Rollback

If a deploy is unhealthy, use Render's rollback/redeploy controls to return the web service to the previous known-good commit. Because game data lives outside the web container when `REDIS_URL` is configured, rolling back the web image does not intentionally erase the shared game store.

If a schema-changing game-state migration is introduced in a future release, add an explicit version field and backward-compatibility plan before relying on this rollback procedure.
