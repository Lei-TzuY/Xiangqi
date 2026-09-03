import test from "node:test";
import assert from "node:assert/strict";
import {
  COLORS,
  applyLegalMove,
  createEmptyBoard,
  createInitialBoard,
  findLegalMove,
  isInCheck,
  legalMoves,
  positionStatus,
  setPiece,
  toFen,
} from "../src/engine.js";

function bareKings() {
  const board = createEmptyBoard();
  setPiece(board, "e0", "K");
  setPiece(board, "e9", "k");
  setPiece(board, "e5", "P");
  return board;
}

test("initial position has the canonical Xiangqi FEN and red to move", () => {
  const board = createInitialBoard();
  assert.equal(
    toFen(board, COLORS.RED),
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w",
  );
  assert.equal(isInCheck(board, COLORS.RED), false);
  assert.ok(legalMoves(board, COLORS.RED).length > 0);
});

test("horse is blocked by its leg", () => {
  const board = bareKings();
  setPiece(board, "b0", "H");
  setPiece(board, "b1", "P");
  const moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "b0");
  assert.equal(moves.some((m) => m.to === "c2"), false);
  assert.equal(moves.some((m) => m.to === "a2"), false);
});

test("elephant cannot cross the river and its eye can be blocked", () => {
  const board = bareKings();
  setPiece(board, "c4", "E");
  let moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "c4");
  assert.equal(moves.some((m) => m.to === "e6"), false);
  assert.equal(moves.some((m) => m.to === "a6"), false);

  setPiece(board, "d3", "P");
  moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "c4");
  assert.equal(moves.some((m) => m.to === "e2"), false);
});

test("cannon captures only with exactly one screen", () => {
  const board = bareKings();
  setPiece(board, "a0", "C");
  setPiece(board, "a2", "P");
  setPiece(board, "a5", "r");
  let moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "a0");
  assert.ok(moves.some((m) => m.to === "a5" && m.capture === "r"));

  setPiece(board, "a3", "P");
  moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "a0");
  assert.equal(moves.some((m) => m.to === "a5"), false);
});

test("pawn gains horizontal movement only after crossing the river", () => {
  const board = bareKings();
  setPiece(board, "c4", "P");
  let moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "c4");
  assert.deepEqual(moves.map((m) => m.to).sort(), ["c5"]);

  setPiece(board, "c4", null);
  setPiece(board, "c5", "P");
  moves = legalMoves(board, COLORS.RED).filter((m) => m.from === "c5");
  assert.deepEqual(moves.map((m) => m.to).sort(), ["b5", "c6", "d5"]);
});

test("a move that exposes the two generals face-to-face is illegal", () => {
  const board = createEmptyBoard();
  setPiece(board, "e0", "K");
  setPiece(board, "e9", "k");
  setPiece(board, "e4", "R");
  assert.equal(findLegalMove(board, COLORS.RED, "e4", "d4"), null);
  assert.ok(findLegalMove(board, COLORS.RED, "e4", "e5"));
});

test("flying general capture is legal on an open file", () => {
  const board = createEmptyBoard();
  setPiece(board, "e0", "K");
  setPiece(board, "e9", "k");
  const move = findLegalMove(board, COLORS.RED, "e0", "e9");
  assert.ok(move);
  const result = applyLegalMove(board, COLORS.RED, "e0", "e9");
  assert.equal(positionStatus(result.board, COLORS.BLACK).winner, COLORS.RED);
});

test("general cannot move outside the palace", () => {
  const board = bareKings();
  assert.equal(findLegalMove(board, COLORS.RED, "e0", "f0")?.to, "f0");
  assert.throws(() => applyLegalMove(board, COLORS.RED, "e0", "g0"), /Illegal red move/);
});
