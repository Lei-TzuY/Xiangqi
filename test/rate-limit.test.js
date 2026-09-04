import test from "node:test";
import assert from "node:assert/strict";
import { createFixedWindowRateLimiter } from "../src/rate-limit.js";

test("rate limiter allows requests up to the configured window limit", () => {
  const allow = createFixedWindowRateLimiter({ limit: 2, windowMs: 1_000 });
  assert.equal(allow("client", 0).allowed, true);
  assert.equal(allow("client", 100).allowed, true);
  const blocked = allow("client", 200);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds, 1);
});

test("rate limiter resets on a new window and isolates clients", () => {
  const allow = createFixedWindowRateLimiter({ limit: 1, windowMs: 1_000 });
  assert.equal(allow("a", 0).allowed, true);
  assert.equal(allow("a", 500).allowed, false);
  assert.equal(allow("b", 500).allowed, true);
  assert.equal(allow("a", 1_001).allowed, true);
});
