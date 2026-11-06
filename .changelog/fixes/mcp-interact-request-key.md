---
hype: 10
---

### Require a request key for `xplat_interact`

The Go `interact` contract mandates `--request-key` for every dispatch — it is the dedupe and receipt identity for a mutation whose outcome can outlive the caller. The MCP tool schema marked `requestKey` optional, so a schema-valid call deterministically failed downstream. The schema now requires the key and says what it buys: reuse an identical key to read the same receipt without dispatching again.
