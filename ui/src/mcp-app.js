import { App } from "@modelcontextprotocol/ext-apps";
import "./styles.css";

const FILES = [..."abcdefghi"];
const PIECES = {
  K: ["帥", "red", "Red general"], A: ["仕", "red", "Red advisor"], B: ["相", "red", "Red elephant"],
  N: ["馬", "red", "Red horse"], R: ["車", "red", "Red rook"], C: ["炮", "red", "Red cannon"], P: ["兵", "red", "Red pawn"],
  k: ["將", "black", "Black general"], a: ["士", "black", "Black advisor"], b: ["象", "black", "Black elephant"],
  n: ["馬", "black", "Black horse"], r: ["車", "black", "Black rook"], c: ["砲", "black", "Black cannon"], p: ["卒", "black", "Black pawn"],
};

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status-text");
const turnChipEl = document.getElementById("turn-chip");
const hintEl = document.getElementById("hint-text");
const flipButton = document.getElementById("flip-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const pipButton = document.getElementById("pip-button");

let game = null;
let selected = null;
let busy = false;
let flipped = false;

function parseFen(fen) {
  const [placement] = fen.split(/\s+/);
  const ranks = placement.split("/");
  if (ranks.length !== 10) throw new Error("Invalid Xiangqi FEN");
  const pieces = new Map();
  ranks.forEach((rank, rankIndex) => {
    let x = 0;
    for (const token of rank) {
      if (/\d/.test(token)) {
        x += Number(token);
      } else {
        if (x >= 9) throw new Error("Invalid Xiangqi FEN rank");
        pieces.set(`${FILES[x]}${9 - rankIndex}`, token);
        x += 1;
      }
    }
    if (x !== 9) throw new Error("Invalid Xiangqi FEN width");
  });
  return pieces;
}

function pieceColor(piece) {
  return piece === piece.toUpperCase() ? "red" : "black";
}

function legalFrom(square) {
  return (game?.legalMoves ?? []).filter((move) => move.from === square);
}

function canUserMove() {
  return game?.status === "active" && game.sideToMove === game.userColor && !busy;
}

function viewpoint() {
  const naturalFlip = game?.userColor === "black";
  return flipped ? !naturalFlip : naturalFlip;
}

function pointOrder() {
  if (viewpoint()) {
    return {
      ranks: Array.from({ length: 10 }, (_, i) => i),
      files: [...FILES].reverse(),
    };
  }
  return {
    ranks: Array.from({ length: 10 }, (_, i) => 9 - i),
    files: FILES,
  };
}

function describeStatus() {
  if (!game) return ["Waiting for a game…", "—", "Start a game to begin."];
  if (game.status !== "active") {
    const winner = game.winner ? `${game.winner[0].toUpperCase()}${game.winner.slice(1)} wins` : "Game over";
    return [`${game.status.replaceAll("_", " ")} · ${winner}`, "Finished", "Start a new game to play again."];
  }
  const side = `${game.sideToMove[0].toUpperCase()}${game.sideToMove.slice(1)}`;
  if (game.sideToMove === game.userColor) {
    return [game.inCheck ? "You are in check" : "Your turn", `${side} · You`, selected ? `Choose a highlighted target for ${selected}.` : "Select one of your pieces."];
  }
  return [game.inCheck ? "Opponent is in check" : "ChatGPT's turn", `${side} · ChatGPT`, "Waiting for ChatGPT to choose a server-validated move."];
}

function render() {
  const [status, turn, hint] = describeStatus();
  statusEl.textContent = status;
  turnChipEl.textContent = turn;
  hintEl.textContent = hint;
  boardEl.classList.toggle("busy", busy);
  boardEl.innerHTML = "";

  if (!game?.fen) return;
  const pieces = parseFen(game.fen);
  const targets = new Map(legalFrom(selected).map((move) => [move.to, move]));
  const { ranks, files } = pointOrder();

  for (const rank of ranks) {
    for (const file of files) {
      const square = `${file}${rank}`;
      const piece = pieces.get(square) ?? null;
      const info = piece ? PIECES[piece] : null;
      const moves = piece && pieceColor(piece) === game.userColor ? legalFrom(square) : [];
      const isSelectable = canUserMove() && moves.length > 0;
      const target = targets.get(square);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "point";
      button.dataset.square = square;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", info ? `${info[2]} on ${square}` : `Empty ${square}`);
      if (isSelectable) button.classList.add("selectable");
      if (square === selected) button.classList.add("selected");
      if (game.lastMove && (square === game.lastMove.from || square === game.lastMove.to)) button.classList.add("last");
      if (target) {
        button.classList.add("target");
        if (target.capture) button.classList.add("capture");
        button.setAttribute("aria-label", `${button.getAttribute("aria-label")}; legal target`);
      }
      if (info) {
        const disk = document.createElement("span");
        disk.className = `piece ${info[1]}`;
        disk.textContent = info[0];
        disk.setAttribute("aria-hidden", "true");
        button.appendChild(disk);
      }
      button.addEventListener("click", () => onSquare(square, piece));
      boardEl.appendChild(button);
    }
  }
}

async function onSquare(square, piece) {
  if (!canUserMove()) return;
  if (selected) {
    const move = legalFrom(selected).find((candidate) => candidate.to === square);
    if (move) {
      await submitMove(move.from, move.to);
      return;
    }
  }

  if (piece && pieceColor(piece) === game.userColor && legalFrom(square).length > 0) {
    selected = selected === square ? null : square;
  } else {
    selected = null;
  }
  render();
}

function resultText(result) {
  return result?.content?.find((item) => item.type === "text")?.text ?? "";
}

function consumeResult(result) {
  if (result?.structuredContent?.gameId && result.structuredContent.fen) {
    game = result.structuredContent;
    selected = null;
    render();
    return true;
  }
  if (result?.isError) hintEl.textContent = resultText(result) || "The move was rejected.";
  return false;
}

async function submitMove(from, to) {
  if (!game) return;
  busy = true;
  selected = null;
  render();
  try {
    const result = await app.callServerTool({
      name: "make_move",
      arguments: { gameId: game.gameId, actor: "user", from, to },
    });
    if (!consumeResult(result)) hintEl.textContent = resultText(result) || "Move could not be applied.";
  } catch (error) {
    hintEl.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    busy = false;
    render();
  }
}

async function requestMode(mode) {
  try {
    await app.requestDisplayMode({ mode });
  } catch (error) {
    hintEl.textContent = `Display mode unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function syncDisplayControls() {
  const modes = app.getHostContext()?.availableDisplayModes ?? [];
  fullscreenButton.hidden = !modes.includes("fullscreen");
  pipButton.hidden = !modes.includes("pip");
}

flipButton.addEventListener("click", () => {
  flipped = !flipped;
  selected = null;
  render();
});
fullscreenButton.addEventListener("click", () => requestMode("fullscreen"));
pipButton.addEventListener("click", () => requestMode("pip"));

const app = new App({ name: "Xiangqi Board", version: "0.2.0" });
app.ontoolresult = (result) => consumeResult(result);
app.onhostcontextchanged = () => syncDisplayControls();
app.connect();
syncDisplayControls();
render();
