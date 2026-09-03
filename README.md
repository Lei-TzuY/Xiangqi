# Xiangqi

A deterministic Chinese chess (Xiangqi) rules engine and OpenAI Plugin/MCP server for playing complete, server-validated games in ChatGPT and Codex.

## Milestone 1

This repository currently provides the headless foundation:

- Full basic move legality for rook, horse, elephant, advisor, general, cannon, and pawn.
- Horse-leg blocking, elephant-eye blocking and river restriction, palace restriction, cannon screens, post-river pawn movement, flying-general rules, self-check prevention, checkmate/stalemate detection, and resignation.
- In-memory game state with explicit user/model color ownership and turn enforcement.
- MCP tools: `start_game`, `get_game`, `list_legal_moves`, `make_move`, and `resign_game`.
- OpenAI plugin packaging under `.codex-plugin/plugin.json` plus a bundled stdio MCP configuration for local Codex testing.
- Node test suite and GitHub Actions CI.

The server uses UCCI-style coordinates `a0` through `i9`. Red begins on ranks `0-4` and moves toward rank `9`.

## Run

Requires Node.js 20+.

```bash
npm install
npm test
npm start
```

The HTTP MCP endpoint is `http://localhost:8787/mcp`; `GET /health` is a simple health check. For local stdio MCP use:

```bash
npm run start:stdio
```

## Current limitations

Milestone 1 deliberately does **not** claim competition-complete adjudication. Long-check/long-chase and repetition rulings are not yet implemented. State is currently process-local and expires after 24 hours, so production deployment still needs a durable shared store. Chinese descriptive move notation (for example `炮二平五`) and the interactive board UI are also planned rather than silently approximated.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the path to public OpenAI Plugin submission.

## License

MIT
