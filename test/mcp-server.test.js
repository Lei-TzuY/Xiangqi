import test from "node:test";
import assert from "node:assert/strict";
import { GameStore } from "../src/game-store.js";
import { createXiangqiServer } from "../src/mcp-server.js";

test("MCP server can be instantiated with the installed SDK", async () => {
  const server = createXiangqiServer(new GameStore());
  assert.ok(server);
  await server.close();
});
