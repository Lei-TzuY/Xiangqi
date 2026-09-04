export function createFixedWindowRateLimiter({ limit = 120, windowMs = 60_000, maxEntries = 20_000 } = {}) {
  if (!Number.isFinite(limit) || limit < 1) throw new Error("limit must be at least 1");
  if (!Number.isFinite(windowMs) || windowMs < 1) throw new Error("windowMs must be at least 1");
  if (!Number.isInteger(maxEntries) || maxEntries < 1) throw new Error("maxEntries must be at least 1");

  const buckets = new Map();

  function makeRoomForNewKey(now) {
    if (buckets.size < maxEntries) return;

    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) buckets.delete(key);
    }

    while (buckets.size >= maxEntries) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) break;
      buckets.delete(oldestKey);
    }
  }

  return function allow(key, now = Date.now()) {
    const current = buckets.get(key);
    if (current && now - current.windowStart < windowMs) {
      current.count += 1;
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - current.windowStart)) / 1000));
      return {
        allowed: current.count <= limit,
        remaining: Math.max(0, limit - current.count),
        retryAfterSeconds: current.count <= limit ? 0 : retryAfterSeconds,
      };
    }

    if (current) buckets.delete(key);
    makeRoomForNewKey(now);
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
  };
}
