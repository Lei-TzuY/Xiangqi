# Roadmap

## M1 — Deterministic headless game core

- [x] Basic Xiangqi piece movement and captures
- [x] Horse-leg and elephant-eye blocking
- [x] River and palace restrictions
- [x] Cannon screen captures
- [x] Flying-general and self-check enforcement
- [x] Checkmate/stalemate/general-capture terminal states
- [x] User/model turn ownership
- [x] MCP tool surface
- [x] Plugin manifest, bundled local MCP config, skill, tests, CI

## M2 — Rules completeness and notation

- [ ] Threefold/repetition tracking
- [ ] Long-check and long-chase adjudication policy with pinned rule references
- [ ] Chinese descriptive notation parser/formatter (`炮二平五`, etc.)
- [ ] Position import/export validation and stronger malformed-position checks
- [ ] Property/fuzz tests for legal-move invariants

## M3 — Interactive board UI

- [x] MCP Apps board component using the stable `text/html;profile=mcp-app` resource contract
- [x] Click/tap move input and server-provided legal-target highlighting
- [x] Responsive mobile/desktop layout, keyboard focus, board orientation, and manual flip
- [x] Host-negotiated fullscreen/PiP controls where supported
- [x] UI remains optional; all tools continue to work headlessly
- [ ] Validate the widget inside ChatGPT developer mode against a hosted HTTPS MCP endpoint
- [ ] Add visual regression/browser tests once a repeatable MCP Apps host harness is pinned

## M4 — Production service

- [ ] Durable shared game store (not process-local memory)
- [ ] Rate limiting, observability, structured logs, abuse controls
- [ ] Public HTTPS deployment with stable `/mcp` endpoint
- [ ] Production health checks and deployment rollback path
- [ ] Load/concurrency testing

## M5 — OpenAI public submission

- [ ] Verify developer identity under the intended publication name
- [ ] Finalize public website/privacy/terms/support endpoints
- [ ] Connect hosted MCP in ChatGPT developer mode and run MCP Inspector
- [ ] Prepare representative positive and negative review test cases
- [ ] Verify tool schemas, annotations, instructions, and UI CSP after Scan Tools
- [ ] Submit through the OpenAI plugin submission portal
