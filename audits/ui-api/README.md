# UI API design audit

A proposed public API for more reliable agent use across the whole `@octane-xplat/ui` package. No framework implementation has changed.

Read these documents in order:

1. [Recommended changes](recommended-changes.md): the compact, prioritized list of concrete public changes and their reasons.
2. [Principles](principles.md): reusable framework development guidelines, each with brief reasoning; candidates for `AGENTS.md`.
3. [Package vision](package-vision.md): canonical import ownership and target contracts for all 126 audited concepts, with current source links.
4. [Approved decisions](approved-decisions.md): the user-approved directions and naming precedence.

Naming prefers **Astryx → React Aria → React Native → generic frontend** for semantically comparable contracts. Approved directions guide the design; proposed spellings and individual changes have not shipped.

The audit uses source evidence. Its expected benefit for agents is a design judgment, not a measured performance result. No runtime targets were run. Source exports were rechecked on 2026-10-14; source links and standalone proposed TypeScript shapes were validated.

The full per-concept audit and export indexes are preserved in commit `d885cd93`. This trimmed folder keeps the five essential review documents. It stays outside the published app-building guides so proposals cannot be confused with supported API instructions.

Implementation requires migration guidance and updates to supported docs, examples, and recipes. This audit changes no supported workflow, so no recipe reconciliation is needed now.
