# OpenAI Plugin review checklist

This is a working checklist, not a claim that the plugin is submission-ready today.

## Server

- [ ] Public production HTTPS domain
- [ ] Stable `/mcp` endpoint reachable by OpenAI reviewers
- [ ] No localhost, temporary tunnel, or test-only endpoint in the final submission
- [x] Shared game state supported across process instances through Redis/Valkey
- [x] Liveness/readiness checks and graceful shutdown
- [x] Production container build covered by CI
- [ ] Persistent paid datastore enabled for the public production service
- [ ] Tool metadata scanned and manually verified after deployment

## Tool contract

- [x] Focused action-oriented tool names
- [x] Explicit input schemas
- [x] Structured outputs for successful calls
- [x] No authentication required for the current public game service
- [x] `readOnlyHint`, `destructiveHint`, and `openWorldHint` reflect actual behavior
- [x] Tool results remain useful without custom UI

## Product quality

- [x] Core move legality covered by regression tests
- [x] Interactive board UI implemented and keyboard-focusable
- [x] Server-authoritative legal-target highlighting
- [ ] Competition-specific repetition/long-check rules implemented and tested
- [ ] Chinese move notation implemented and tested
- [ ] Representative evaluation set covers positive, boundary, and negative prompts

## Publication

- [ ] Developer identity verified in OpenAI Platform
- [ ] Publication name matches verified identity/business
- [ ] Privacy policy and terms reviewed for the final production data flow
- [ ] Support URL monitored
- [ ] Logo and screenshots prepared
- [ ] Submission localization reviewed
