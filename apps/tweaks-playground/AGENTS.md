# tweaks-playground

Private web playground for `@octane-xplat/tweaks` — exercises `useTweak`,
inline/bamboo style sites, pick, and Save under `xplat dev web`.

- `bun run dev` — `xplat dev web` (Vite on :5200; tweaks plugin before the
  Octane plugins in `vite.config.ts`).
- `bun run test` — vitest web tests (jsdom).
- `bun run turbo run test:e2e --filter=tweaks-playground` (from repo root) — transport e2e: starts `xplat dev web` with an isolated
  `XPLAT_DEV_CACHE`, drives Chromium via playwright, and talks to the tweaks
  backend as a Node panel through `@octane-xplat/devtools/client`. Requires
  the pinned Go compiler; Turbo builds the repo Go CLI at `research/go-cli/`.
  Restores `src/App.tsrx` after Save. Set `TWEAKS_TEST_PORT` when :5200 is
  occupied; Vite uses strict port binding to avoid testing another app.
- `src/editor-tabs.web.test.tsx` checks the separate editors and scoped
  save/revert messages in jsdom; this does not qualify native OS input.
