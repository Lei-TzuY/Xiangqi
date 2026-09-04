import test from "node:test";
import assert from "node:assert/strict";
import { RedisGameStore } from "../src/game-store.js";

class FakeRedis {
  constructor(shared = { values: new Map(), versions: new Map() }) {
    this.shared = shared;
    this.watched = new Map();
    this.status = "ready";
  }

  duplicate() {
    return new FakeRedis(this.shared);
  }

  bump(key) {
    this.shared.versions.set(key, (this.shared.versions.get(key) ?? 0) + 1);
  }

  async set(key, value, ...args) {
    const nx = args.includes("NX");
    if (nx && this.shared.values.has(key)) return null;
    this.shared.values.set(key, value);
    this.bump(key);
    return "OK";
  }

  async get(key) {
    return this.shared.values.get(key) ?? null;
  }

  async watch(key) {
    this.watched.set(key, this.shared.versions.get(key) ?? 0);
    return "OK";
  }

  multi() {
    const operations = [];
    const tx = {
      set: (...args) => {
        operations.push(args);
        return tx;
      },
      exec: async () => {
        for (const [key, version] of this.watched) {
          if ((this.shared.versions.get(key) ?? 0) !== version) return null;
        }
        const results = [];
        for (const [key, value] of operations) {
          this.shared.values.set(key, value);
          this.bump(key);
          results.push([null, "OK"]);
        }
        return results;
      },
    };
    return tx;
  }

  async ping() {
    return "PONG";
  }

  async quit() {
    this.status = "end";
    return "OK";
  }

  disconnect() {
    this.status = "end";
  }
}

test("RedisGameStore shares a game across independent store instances", async () => {
  const shared = { values: new Map(), versions: new Map() };
  const first = new RedisGameStore(new FakeRedis(shared), { keyPrefix: "test:", ttlSeconds: 60 });
  const second = new RedisGameStore(new FakeRedis(shared), { keyPrefix: "test:", ttlSeconds: 60 });

  const game = await first.start("red");
  const loaded = await second.get(game.id);
  assert.equal(loaded.id, game.id);
  assert.equal(loaded.sideToMove, "red");

  await second.move(game.id, "user", "a3", "a4");
  const afterMove = await first.get(game.id);
  assert.equal(afterMove.ply, 1);
  assert.equal(afterMove.sideToMove, "black");
});

test("RedisGameStore health reports its shared backend", async () => {
  const store = new RedisGameStore(new FakeRedis());
  assert.deepEqual(await store.health(), { ok: true, backend: "redis" });
});
