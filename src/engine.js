export const FILES = "abcdefghi";
export const WIDTH = 9;
export const HEIGHT = 10;
export const COLORS = Object.freeze({ RED: "red", BLACK: "black" });

const START_ROWS = [
  "RHEAKAEHR",
  ".........",
  ".C.....C.",
  "P.P.P.P.P",
  ".........",
  ".........",
  "p.p.p.p.p",
  ".c.....c.",
  ".........",
  "rheakaehr",
];

export function createInitialBoard() {
  return START_ROWS.map((row) => [...row].map((piece) => (piece === "." ? null : piece)));
}

export function createEmptyBoard() {
  return Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null));
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function pieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? COLORS.RED : COLORS.BLACK;
}

export function opposite(color) {
  return color === COLORS.RED ? COLORS.BLACK : COLORS.RED;
}

export function parseSquare(square) {
  if (typeof square !== "string" || !/^[a-i][0-9]$/.test(square)) {
    throw new Error(`Invalid Xiangqi square: ${square}`);
  }
  return { x: FILES.indexOf(square[0]), y: Number(square[1]) };
}

export function formatSquare(x, y) {
  if (!inside(x, y)) throw new Error(`Invalid Xiangqi coordinates: ${x},${y}`);
  return `${FILES[x]}${y}`;
}

export function setPiece(board, square, piece) {
  const { x, y } = parseSquare(square);
  board[y][x] = piece;
  return board;
}

export function getPiece(board, square) {
  const { x, y } = parseSquare(square);
  return board[y][x];
}

function inside(x, y) {
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}

function inPalace(color, x, y) {
  if (x < 3 || x > 5) return false;
  return color === COLORS.RED ? y >= 0 && y <= 2 : y >= 7 && y <= 9;
}

function crossedRiver(color, y) {
  return color === COLORS.RED ? y >= 5 : y <= 4;
}

function moveRecord(board, x, y, tx, ty) {
  return {
    from: formatSquare(x, y),
    to: formatSquare(tx, ty),
    piece: board[y][x],
    capture: board[ty][tx] ?? null,
  };
}

function addIfReachable(board, color, moves, x, y, tx, ty) {
  if (!inside(tx, ty)) return;
  const target = board[ty][tx];
  if (!target || pieceColor(target) !== color) {
    moves.push(moveRecord(board, x, y, tx, ty));
  }
}

export function pseudoMovesForPiece(board, x, y) {
  const piece = board[y]?.[x];
  if (!piece) return [];
  const color = pieceColor(piece);
  const type = piece.toUpperCase();
  const moves = [];

  if (type === "R") {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let step = 1; ; step += 1) {
        const tx = x + dx * step;
        const ty = y + dy * step;
        if (!inside(tx, ty)) break;
        const target = board[ty][tx];
        if (!target) {
          moves.push(moveRecord(board, x, y, tx, ty));
          continue;
        }
        if (pieceColor(target) !== color) moves.push(moveRecord(board, x, y, tx, ty));
        break;
      }
    }
  } else if (type === "C") {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let screened = false;
      for (let step = 1; ; step += 1) {
        const tx = x + dx * step;
        const ty = y + dy * step;
        if (!inside(tx, ty)) break;
        const target = board[ty][tx];
        if (!screened) {
          if (!target) {
            moves.push(moveRecord(board, x, y, tx, ty));
          } else {
            screened = true;
          }
        } else if (target) {
          if (pieceColor(target) !== color) moves.push(moveRecord(board, x, y, tx, ty));
          break;
        }
      }
    }
  } else if (type === "H") {
    const jumps = [
      [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
      [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
    ];
    for (const [dx, dy, lx, ly] of jumps) {
      if (inside(x + lx, y + ly) && !board[y + ly][x + lx]) {
        addIfReachable(board, color, moves, x, y, x + dx, y + dy);
      }
    }
  } else if (type === "E") {
    for (const [dx, dy] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const tx = x + dx;
      const ty = y + dy;
      if (!inside(tx, ty)) continue;
      if (color === COLORS.RED && ty > 4) continue;
      if (color === COLORS.BLACK && ty < 5) continue;
      if (board[y + dy / 2][x + dx / 2]) continue;
      addIfReachable(board, color, moves, x, y, tx, ty);
    }
  } else if (type === "A") {
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const tx = x + dx;
      const ty = y + dy;
      if (inside(tx, ty) && inPalace(color, tx, ty)) {
        addIfReachable(board, color, moves, x, y, tx, ty);
      }
    }
  } else if (type === "K") {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = x + dx;
      const ty = y + dy;
      if (inside(tx, ty) && inPalace(color, tx, ty)) {
        addIfReachable(board, color, moves, x, y, tx, ty);
      }
    }

    for (const dy of [1, -1]) {
      for (let ty = y + dy; inside(x, ty); ty += dy) {
        const target = board[ty][x];
        if (!target) continue;
        if (pieceColor(target) !== color && target.toUpperCase() === "K") {
          moves.push(moveRecord(board, x, y, x, ty));
        }
        break;
      }
    }
  } else if (type === "P") {
    const forward = color === COLORS.RED ? 1 : -1;
    addIfReachable(board, color, moves, x, y, x, y + forward);
    if (crossedRiver(color, y)) {
      addIfReachable(board, color, moves, x, y, x + 1, y);
      addIfReachable(board, color, moves, x, y, x - 1, y);
    }
  }

  return moves;
}

export function findGeneral(board, color) {
  const king = color === COLORS.RED ? "K" : "k";
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (board[y][x] === king) return { x, y };
    }
  }
  return null;
}

export function isSquareAttacked(board, x, y, byColor) {
  for (let sy = 0; sy < HEIGHT; sy += 1) {
    for (let sx = 0; sx < WIDTH; sx += 1) {
      const piece = board[sy][sx];
      if (!piece || pieceColor(piece) !== byColor) continue;
      if (pseudoMovesForPiece(board, sx, sy).some((move) => move.to === formatSquare(x, y))) {
        return true;
      }
    }
  }
  return false;
}

export function isInCheck(board, color) {
  const general = findGeneral(board, color);
  if (!general) return true;
  return isSquareAttacked(board, general.x, general.y, opposite(color));
}

export function applyUnchecked(board, move) {
  const next = cloneBoard(board);
  const from = parseSquare(move.from);
  const to = parseSquare(move.to);
  next[to.y][to.x] = next[from.y][from.x];
  next[from.y][from.x] = null;
  return next;
}

export function legalMoves(board, color) {
  const moves = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const piece = board[y][x];
      if (!piece || pieceColor(piece) !== color) continue;
      for (const move of pseudoMovesForPiece(board, x, y)) {
        const next = applyUnchecked(board, move);
        if (!isInCheck(next, color)) moves.push(move);
      }
    }
  }
  return moves;
}

export function findLegalMove(board, color, from, to) {
  return legalMoves(board, color).find((move) => move.from === from && move.to === to) ?? null;
}

export function applyLegalMove(board, color, from, to) {
  parseSquare(from);
  parseSquare(to);
  const move = findLegalMove(board, color, from, to);
  if (!move) throw new Error(`Illegal ${color} move: ${from}-${to}`);
  return { board: applyUnchecked(board, move), move };
}

export function positionStatus(board, sideToMove) {
  const redGeneral = findGeneral(board, COLORS.RED);
  const blackGeneral = findGeneral(board, COLORS.BLACK);
  if (!redGeneral) return { status: "general_captured", winner: COLORS.BLACK, inCheck: true };
  if (!blackGeneral) return { status: "general_captured", winner: COLORS.RED, inCheck: true };

  const inCheck = isInCheck(board, sideToMove);
  const moves = legalMoves(board, sideToMove);
  if (moves.length === 0) {
    return {
      status: inCheck ? "checkmate" : "stalemate",
      winner: opposite(sideToMove),
      inCheck,
    };
  }
  return { status: "active", winner: null, inCheck };
}

const FEN_MAP = Object.freeze({ H: "N", h: "n", E: "B", e: "b" });

export function toFen(board, sideToMove) {
  const ranks = [];
  for (let y = HEIGHT - 1; y >= 0; y -= 1) {
    let rank = "";
    let empty = 0;
    for (let x = 0; x < WIDTH; x += 1) {
      const piece = board[y][x];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) {
        rank += String(empty);
        empty = 0;
      }
      rank += FEN_MAP[piece] ?? piece;
    }
    if (empty) rank += String(empty);
    ranks.push(rank);
  }
  return `${ranks.join("/")} ${sideToMove === COLORS.RED ? "w" : "b"}`;
}

export function boardText(board) {
  const lines = [];
  for (let y = HEIGHT - 1; y >= 0; y -= 1) {
    lines.push(`${y} ${board[y].map((piece) => piece ?? ".").join(" ")}`);
  }
  lines.push(`  ${FILES.split("").join(" ")}`);
  return lines.join("\n");
}
