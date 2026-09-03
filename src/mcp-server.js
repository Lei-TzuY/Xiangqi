import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GameStore } from "./game-store.js";

export const gameStore = new GameStore();

const colorSchema = z.enum(["red", "black"]);
const statusSchema = z.enum(["active", "checkmate", "stalemate", "general_captured", "resigned"]);
const actorSchema = z.enum(["user", "model"]);
const squareSchema = z.string().regex(/^[a-i][0-9]$/, "Use UCCI coordinates a0 through i9");
const pieceSchema = z.string().length(1);

const moveSchema = z.object({
  from: squareSchema,
  to: squareSchema,
  piece: pieceSchema,
  capture: pieceSchema.nullable(),
});

const lastMoveSchema = z.object({
  ply: z.number().int().positive(),
  color: colorSchema,
  actor: actorSchema,
  from: squareSchema,
  to: squareSchema,
  piece: pieceSchema,
  capture: pieceSchema.nullable(),
});

const gameOutputSchema = {
  gameId: z.string().uuid(),
  status: statusSchema,
  winner: colorSchema.nullable(),
  sideToMove: colorSchema,
  userColor: colorSchema,
  modelColor: colorSchema,
  inCheck: z.boolean(),
  ply: z.number().int().nonnegative(),
  fen: z.string(),
  board: z.string(),
  lastMove: lastMoveSchema.nullable(),
  legalMoves: z.array(moveSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
};

const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
};

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
};

function textResult(structuredContent, text) {
  return {
    structuredContent,
    content: [{ type: "text", text }],
  };
}

function errorResult(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

export function createXiangqiServer(store = gameStore) {
  const server = new McpServer(
    { name: "xiangqi", version: "0.1.0" },
    {
      instructions:
        "Use start_game before game actions. Treat server legality as authoritative. For a user-supplied move, call make_move with actor=user only after mapping it to UCCI a0-i9 coordinates. On the model's turn, call list_legal_moves, choose one returned move, then call make_move with actor=model. Never invent or silently alter a rejected move. Red starts at ranks 0-4 and moves toward rank 9.",
    },
  );

  server.registerTool(
    "start_game",
    {
      title: "Start Xiangqi game",
      description:
        "Start a new Xiangqi game. Use when the user asks to play Chinese chess or wants a fresh game. Red always moves first.",
      inputSchema: {
        userColor: colorSchema.optional().default("red").describe("The side controlled by the user."),
      },
      outputSchema: gameOutputSchema,
      securitySchemes: [{ type: "noauth" }],
      annotations: writeAnnotations,
    },
    async ({ userColor }) => {
      try {
        const game = store.start(userColor);
        const view = store.view(game, false);
        const firstActor = game.userColor === "red" ? "user" : "model";
        return textResult(
          view,
          `Started game ${game.id}. User is ${game.userColor}; model is ${game.modelColor}. Red moves first (${firstActor}).`,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_game",
    {
      title: "Get Xiangqi game",
      description: "Read the current board, turn, check state, and result for an existing Xiangqi game.",
      inputSchema: { gameId: z.string().uuid() },
      outputSchema: gameOutputSchema,
      securitySchemes: [{ type: "noauth" }],
      annotations: readAnnotations,
    },
    async ({ gameId }) => {
      try {
        const game = store.get(gameId);
        return textResult(store.view(game, false), `Game ${gameId}: ${game.status}; ${game.sideToMove} to move.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_legal_moves",
    {
      title: "List legal Xiangqi moves",
      description:
        "List every server-validated legal move for the side to move. Use before choosing the model's move or when the user asks what moves are legal.",
      inputSchema: { gameId: z.string().uuid() },
      outputSchema: {
        gameId: z.string().uuid(),
        sideToMove: colorSchema,
        legalMoves: z.array(moveSchema),
      },
      securitySchemes: [{ type: "noauth" }],
      annotations: readAnnotations,
    },
    async ({ gameId }) => {
      try {
        const game = store.get(gameId);
        const moves = store.legal(gameId);
        const result = { gameId, sideToMove: game.sideToMove, legalMoves: moves };
        return textResult(result, `${moves.length} legal moves for ${game.sideToMove}.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "make_move",
    {
      title: "Make Xiangqi move",
      description:
        "Apply exactly one Xiangqi move after the user or model has chosen it. The server rejects illegal moves, wrong-turn actors, self-check, and flying-general violations.",
      inputSchema: {
        gameId: z.string().uuid(),
        actor: actorSchema.describe("Use user only for a move chosen by the user; use model for the assistant's own move."),
        from: squareSchema.describe("Source square in UCCI coordinates, e.g. h2."),
        to: squareSchema.describe("Destination square in UCCI coordinates, e.g. e2."),
      },
      outputSchema: gameOutputSchema,
      securitySchemes: [{ type: "noauth" }],
      annotations: writeAnnotations,
    },
    async ({ gameId, actor, from, to }) => {
      try {
        const { game, move } = store.move(gameId, actor, from, to);
        const view = store.view(game, false);
        const suffix = game.status === "active"
          ? `${game.sideToMove} to move${game.inCheck ? " in check" : ""}.`
          : `Game ended: ${game.status}; winner ${game.winner}.`;
        return textResult(view, `Applied ${move.color} ${from}-${to}. ${suffix}`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "resign_game",
    {
      title: "Resign Xiangqi game",
      description: "End an active Xiangqi game because the user or model explicitly resigns.",
      inputSchema: {
        gameId: z.string().uuid(),
        actor: actorSchema.describe("The side that explicitly chose to resign."),
      },
      outputSchema: gameOutputSchema,
      securitySchemes: [{ type: "noauth" }],
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async ({ gameId, actor }) => {
      try {
        const game = store.resign(gameId, actor);
        return textResult(store.view(game, false), `${actor} resigned. ${game.winner} wins game ${gameId}.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}
