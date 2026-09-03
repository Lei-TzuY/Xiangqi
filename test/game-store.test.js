import test from "node:test";
import assert from "node:assert/strict";
import { GameStore } from "../src/game-store.js";

test("red user starts and turns alternate between user and model", () => {
  const store = new GameStore();
  const game = store.start("red");
  assert.equal(game.sideToMove, "red");
  assert.throws(() => store.move(game.id, "model", "a6", "a5"), /red's turn/);

  const first = store.move(game.id, "user", "a3", "a4");
  assert.equal(first.game.sideToMove, "black");
  assert.equal(first.move.actor, "user");

  const second = store.move(game.id, "model", "a6", "a5");
  assert.equal(second.game.sideToMove, "red");
  assert.equal(second.game.ply, 2);
});

test("black user means the model owns the opening red move", () => {
  const store = new GameStore();
  const game = store.start("black");
  assert.equal(game.modelColor, "red");
  assert.throws(() => store.move(game.id, "user", "a6", "a5"), /red's turn/);
  store.move(game.id, "model", "a3", "a4");
  assert.equal(game.sideToMove, "black");
});

test("resignation ends the game and awards the opponent", () => {
  const store = new GameStore();
  const game = store.start("red");
  const finished = store.resign(game.id, "user");
  assert.equal(finished.status, "resigned");
  assert.equal(finished.winner, "black");
  assert.throws(() => store.move(game.id, "user", "a3", "a4"), /already finished/);
});
