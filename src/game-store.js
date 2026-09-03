import { randomUUID } from "node:crypto";
import {
  COLORS,
  applyLegalMove,
  boardText,
  createInitialBoard,
  legalMoves,
  opposite,
  positionStatus,
  toFen,
} from "./engine.js";

const MAX_GAMES = 5000;
const GAME_TTL_MS = 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

export class GameStore {
  constructor() {
    this.games = new Map();
  }

  prune(now = Date.now()) {
    for (const [id, game] of this.games) {
      if (now - game.updatedAtMs > GAME_TTL_MS) this.games.delete(id);
    }
    while (this.games.size >= MAX_GAMES) {
      const oldest = this.games.keys().next().value;
      if (!oldest) break;
      this.games.delete(oldest);
    }
  }

  start(userColor = COLORS.RED) {
    if (![COLORS.RED, COLORS.BLACK].includes(userColor)) {
      throw new Error(`Invalid user color: ${userColor}`);
    }
    this.prune();
    const createdAt = nowIso();
    const board = createInitialBoard();
    const game = {
      id: randomUUID(),
      board,
      userColor,
      modelColor: opposite(userColor),
      sideToMove: COLORS.RED,
      status: "active",
      winner: null,
      inCheck: false,
      ply: 0,
      history: [],
      createdAt,
      updatedAt: createdAt,
      updatedAtMs: Date.now(),
    };
    this.games.set(game.id, game);
    return game;
  }

  get(gameId) {
    const game = this.games.get(gameId);
    if (!game) throw new Error(`Game not found or expired: ${gameId}`);
    return game;
  }

  actorColor(game, actor) {
    if (actor === "user") return game.userColor;
    if (actor === "model") return game.modelColor;
    throw new Error(`Invalid actor: ${actor}`);
  }

  move(gameId, actor, from, to) {
    const game = this.get(gameId);
    if (game.status !== "active") throw new Error(`Game is already finished: ${game.status}`);

    const color = this.actorColor(game, actor);
    if (color !== game.sideToMove) {
      throw new Error(`It is ${game.sideToMove}'s turn, not ${color}'s turn`);
    }

    const { board, move } = applyLegalMove(game.board, color, from, to);
    game.board = board;
    game.ply += 1;
    game.sideToMove = opposite(color);
    game.history.push({ ply: game.ply, color, actor, ...move });

    const status = positionStatus(game.board, game.sideToMove);
    game.status = status.status;
    game.winner = status.winner;
    game.inCheck = status.inCheck;
    game.updatedAt = nowIso();
    game.updatedAtMs = Date.now();
    return { game, move: game.history.at(-1) };
  }

  resign(gameId, actor) {
    const game = this.get(gameId);
    if (game.status !== "active") throw new Error(`Game is already finished: ${game.status}`);
    const color = this.actorColor(game, actor);
    game.status = "resigned";
    game.winner = opposite(color);
    game.inCheck = false;
    game.updatedAt = nowIso();
    game.updatedAtMs = Date.now();
    return game;
  }

  legal(gameId) {
    const game = this.get(gameId);
    if (game.status !== "active") return [];
    return legalMoves(game.board, game.sideToMove);
  }

  view(game, includeLegalMoves = false) {
    return {
      gameId: game.id,
      status: game.status,
      winner: game.winner,
      sideToMove: game.sideToMove,
      userColor: game.userColor,
      modelColor: game.modelColor,
      inCheck: game.inCheck,
      ply: game.ply,
      fen: toFen(game.board, game.sideToMove),
      board: boardText(game.board),
      lastMove: game.history.at(-1) ?? null,
      legalMoves: includeLegalMoves ? this.legal(game.id) : [],
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }
}
