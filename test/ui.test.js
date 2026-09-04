import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GameStore } from "../src/game-store.js";
import { BOARD_RESOURCE_URI, createXiangqiServer, loadBoardHtml } from "../src/mcp-server.js";

test("built MCP App is a self-contained Xiangqi board", async () => {
  const html = await loadBoardHtml();
  assert.match(html, /Play Xiangqi/);
  assert.match(html, /Xiangqi Board/);
  assert.ok(html.includes("<script"));
  assert.ok(html.length > 10_000);
});

test("board source uses the MCP Apps bridge for tool calls and display modes", async () => {
  const source = await readFile(new URL("../ui/src/mcp-app.js", import.meta.url), "utf8");
  assert.match(source, /callServerTool/);
  assert.match(source, /requestDisplayMode/);
  assert.match(source, /legalMoves/);
});

test("game views expose server-authoritative legal moves for the board", () => {
  const store = new GameStore();
  const game = store.start("red");
  const view = store.view(game, true);
  assert.ok(view.legalMoves.length > 0);
  assert.ok(view.legalMoves.every((move) => /^[a-i][0-9]$/.test(move.from) && /^[a-i][0-9]$/.test(move.to)));
});

test("MCP server registers the board resource without breaking server construction", async () => {
  assert.match(BOARD_RESOURCE_URI, /^ui:\/\//);
  const server = createXiangqiServer(new GameStore());
  assert.ok(server);
  await server.close();
});
