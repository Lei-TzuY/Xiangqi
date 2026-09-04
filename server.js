import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createXiangqiServer, gameStore } from "./src/mcp-server.js";
import { createFixedWindowRateLimiter } from "./src/rate-limit.js";

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";
const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
const rateLimit = createFixedWindowRateLimiter({
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120),
  windowMs: 60_000,
});

function log(level, event, fields = {}) {
  const entry = { time: new Date().toISOString(), level, event, ...fields };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else console.log(output);
}

function clientAddress(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, RateLimit-Remaining");
}

const httpServer = createServer(async (req, res) => {
  const requestId = req.headers["x-request-id"]?.toString() ?? randomUUID();
  const startedAt = Date.now();
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    log("info", "http_request", {
      requestId,
      method: req.method,
      path: url.pathname,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    setCors(res);
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, x-request-id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ service: "xiangqi-mcp", status: "ok", version: "0.3.0", mcp: MCP_PATH }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/ready") {
    try {
      const health = await gameStore.health();
      res.writeHead(health.ok ? 200 : 503, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ service: "xiangqi-mcp", status: health.ok ? "ready" : "unavailable", ...health }));
    } catch (error) {
      log("error", "readiness_failed", { requestId, message: error instanceof Error ? error.message : String(error) });
      res.writeHead(503, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ service: "xiangqi-mcp", status: "unavailable" }));
    }
    return;
  }

  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    setCors(res);
    const decision = rateLimit(clientAddress(req));
    res.setHeader("RateLimit-Remaining", String(decision.remaining));
    if (!decision.allowed) {
      res.setHeader("Retry-After", String(decision.retryAfterSeconds));
      res.writeHead(429, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "rate_limit_exceeded", retryAfterSeconds: decision.retryAfterSeconds }));
      return;
    }

    const server = createXiangqiServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      log("error", "mcp_request_failed", { requestId, message: error instanceof Error ? error.message : String(error) });
      if (!res.headersSent) res.writeHead(500).end("Internal server error");
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

async function shutdown(signal) {
  log("info", "shutdown_started", { signal });
  httpServer.close(async () => {
    try {
      await gameStore.close();
    } finally {
      log("info", "shutdown_complete", { signal });
      process.exit(0);
    }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

httpServer.listen(port, "0.0.0.0", () => {
  log("info", "server_started", { port, mcpPath: MCP_PATH, store: gameStore.backend });
});
