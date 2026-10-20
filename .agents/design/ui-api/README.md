# UI API design audit

A proposed public API for more reliable agent use across the whole `@octane-xplat/ui` package, plus the approved directions now being implemented.

Read these documents in order:

1. [Recommended changes](recommended-changes.md): the compact, prioritized list of concrete public changes and their reasons.
2. [Principles](principles.md): reusable framework development guidelines, each with brief reasoning; candidates for `AGENTS.md`.
3. [Package vision](package-vision.md): canonical import ownership and target contracts for all 126 audited concepts, with current source links.
4. [Approved decisions](approved-decisions.md): the user-approved directions and naming precedence.

Naming prefers **Astryx → React Aria → React Native → generic frontend** for semantically comparable contracts. Approved directions guide the design; unapproved spellings and remaining individual changes have not shipped.

The audit uses source evidence. Its expected benefit for agents is a design judgment, not a measured performance result. No runtime targets were run. Source exports were rechecked on 2026-10-14; source links and standalone proposed TypeScript shapes were validated.

The full per-concept audit and export indexes are preserved in commit `d885cd93`. This trimmed folder keeps the five essential review documents. It stays outside the published app-building guides so proposals cannot be confused with supported API instructions.

Approved changes ship as breaking releases with migration guidance in
`docs/testing/known-limits.md`, including the `/routing`, `/data`,
`/markdown`, and `/chat` entrypoints, truthful platform contracts, and
request-scoped search cancellation. Supported docs, examples, and recipes
are reconciled as each change lands (`pnpm check:recipes`); decisions D1–D6
remain the standing criteria for the remaining proposals.
