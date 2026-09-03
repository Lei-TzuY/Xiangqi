---
name: play-xiangqi
description: Play, inspect, or resign a Chinese chess (Xiangqi) game using the plugin's server-validated tools. Use when the user asks to start or continue Xiangqi, make a move, inspect legal moves, or resign.
---

# Play Xiangqi

Use the Xiangqi MCP server as the source of truth for board state and move legality.

## Workflow

1. If there is no active game, call `start_game` with the user's requested color. Red moves first.
2. Preserve the returned `gameId` for all later calls in that game.
3. For a move explicitly chosen by the user, map it to UCCI coordinates `a0` through `i9` and call `make_move` with `actor: "user"`.
4. Never alter a rejected user move. Explain that it is illegal and, when useful, call `list_legal_moves` to show valid alternatives.
5. When it is the model's turn, call `list_legal_moves`, choose only from the returned moves, then call `make_move` with `actor: "model"`.
6. Use `get_game` when the current position or game status is uncertain.
7. Call `resign_game` only when the relevant side explicitly resigns.

## Coordinate orientation

Files are `a` through `i`. Ranks are `0` through `9`. Red starts on ranks `0-4` and advances toward rank `9`; Black starts on ranks `5-9` and advances toward rank `0`.

## Safety and correctness

Do not invent board state, legal moves, captures, checks, or results. Tool output is authoritative. This version does not adjudicate competition-specific long-check/long-chase repetition rules; do not claim that it does.
