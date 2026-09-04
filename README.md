# Xiangqi

A deterministic Chinese chess (Xiangqi) rules engine, OpenAI Plugin/MCP server, interactive MCP Apps board, and production-ready shared-state service for ChatGPT and compatible MCP hosts.

## What works today

- Server-authoritative movement and captures for rook, horse, elephant, advisor, general, cannon, and pawn.
- Horse-leg blocking, elephant-eye blocking and river restriction, palace restriction, cannon screens, post-river pawn movement, flying-general rules, self-check prevention, checkmate/stalemate detection, and resignation.
- Explicit user/model color ownership and turn enforcement.
- MCP tools: `start_game`, `get_game`, `list_legal_moves`, `make_move`, and `resign_game`.
- Interactive MCP Apps board using `text/html;profile=mcp-app`, bundled as a single HTML resource.
- Click/tap move input with server-provided legal targets, user-color board orientation, manual flip, last-move highlighting, keyboard-focusable squares, responsive layout, and host-negotiated fullscreen/PiP where supported.
- Memory game store for local development and Redis/Valkey shared game state when `REDIS_URL` is configured.
- Optimistic concurrency for shared-store move/resign mutations so multiple service instances cannot silently overwrite the same game.
- `/health` liveness, `/ready` datastore readiness, per-client MCP rate limiting, structured JSON request/error logs, and graceful shutdown.
- Docker production image and a Render Blueprint targeting Singapore.
- GitHub Actions on Node 20/22 plus a production Docker build.

The server uses UCCI-style coordinates `a0` through `i9`. Red begins on ranks `0-4` and moves toward rank `9`. The UI never decides move legality: every highlighted move originates from the server and every click-to-move action is revalidated by `make_move`.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
npm test
npm start
```

The HTTP MCP endpoint is `http://localhost:8787/mcp`. `GET /health` is a dependency-free liveness check and `GET /ready` verifies the selected game-store backend.

For local stdio MCP use:

```bash
npm run start:stdio
```

## Shared state

Without `REDIS_URL`, Xiangqi uses process-local memory. Set a Redis-compatible URL to share game state across server instances:

```bash
REDIS_URL=redis://localhost:6379 npm start
```

Games have a 24-hour TTL. Writes use optimistic Redis transactions to reject conflicting concurrent updates instead of silently losing a move.

## Render staging

`render.yaml` defines a free Singapore-region web service plus a private Render Key Value (Valkey) instance. It is intentionally a **staging** configuration: Render Free Key Value does not persist data across datastore restarts.

For an OpenAI submission-grade production service, upgrade the Key Value resource to a paid persistent plan and complete the hosted load/concurrency checks in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Current limitations

The project does **not** yet claim competition-complete adjudication. Long-check/long-chase and repetition rulings are not implemented. Chinese descriptive move notation (for example `炮二平五`) is also still planned.

The board implements the stable MCP Apps protocol and includes ChatGPT compatibility aliases. Public ChatGPT testing still requires a deployed HTTPS MCP endpoint and developer-mode connection.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining path to public OpenAI Plugin submission.

## License

MIT
