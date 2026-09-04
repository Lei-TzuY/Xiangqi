export function createFixedWindowRateLimiter({ limit = 120, windowMs = 60_000, maxEntries = 20_000 } = {}) {
  const buckets = new Map();

  function prune(now) {
    if (buckets.size < maxEntries) return;
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) buckets.delete(key);
      if (buckets.size < maxEntries) break;
    }
  }

  return function allow(key, now = Date.now()) {
    prune(now);
    const current = buckets.get(key);
    if (!current || now - current.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
    }

    current.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - current.windowStart)) / 1000));
    return {
      allowed: current.count <= limit,
      remaining: Math.max(0, limit - current.count),
      retryAfterSeconds,
    };
  };
}
