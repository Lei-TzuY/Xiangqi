# Xiangqi

A deterministic Chinese chess (Xiangqi) rules engine, OpenAI Plugin/MCP server, and interactive MCP Apps board for playing server-validated games in ChatGPT and compatible MCP hosts.

## Current milestone

The project now combines a headless rules authority with an interactive board:

- Full basic move legality for rook, horse, elephant, advisor, general, cannon, and pawn.
- Horse-leg blocking, elephant-eye blocking and river restriction, palace restriction, cannon screens, post-river pawn movement, flying-general rules, self-check prevention, checkmate/stalemate detection, and resignation.
- In-memory game state with explicit user/model color ownership and turn enforcement.
- MCP tools: `start_game`, `get_game`, `list_legal_moves`, `make_move`, and `resign_game`.
- MCP Apps board resource using `text/html;profile=mcp-app`, bundled as a single HTML resource.
- Click/tap move input: select a piece, see server-provided legal targets, then submit the move through `make_move`.
- User-color board orientation, manual board flip, last-move highlighting, keyboard-focusable squares, responsive layout, and host-negotiated fullscreen/PiP controls where supported.
- OpenAI compatibility metadata (`openai/outputTemplate` / `openai/widgetAccessible`) alongside standard `_meta.ui.resourceUri`.
- OpenAI plugin packaging under `.codex-plugin/plugin.json` plus a bundled stdio MCP configuration for local Codex testing.
- Node test suite and GitHub Actions CI on Node 20 and 22.

The server uses UCCI-style coordinates `a0` through `i9`. Red begins on ranks `0-4` and moves toward rank `9`. The UI never decides move legality: every highlighted move originates from the server and every click-to-move action is revalidated by `make_move`.

## Run

Requires Node.js 20.19+.

```bash
npm install
npm test
npm start
```

`npm test` builds the MCP App into a self-contained `dist/index.html` before running the engine/server/UI contract tests. `npm start` also builds the UI automatically.

The HTTP MCP endpoint is `http://localhost:8787/mcp`; `GET /health` is a simple health check. For local stdio MCP use:

```bash
npm run start:stdio
```

## Current limitations

The project does **not** yet claim competition-complete adjudication. Long-check/long-chase and repetition rulings are not implemented. State is process-local and expires after 24 hours, so production deployment still needs a durable shared store. Chinese descriptive move notation (for example `炮二平五`) is also still planned.

The board is implemented against the stable MCP Apps protocol and includes ChatGPT compatibility aliases, but public ChatGPT testing still requires a hosted HTTPS MCP endpoint and developer-mode connection.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the path to public OpenAI Plugin submission.

## License

MIT
