# tweaks-playground

Private web playground for `@octane-xplat/tweaks` — exercises `useTweak`,
inline/bamboo style sites, pick, and Save under `xplat dev web`.

- `bun run dev` — `xplat dev web` (Vite on :5200; tweaks plugin before the
  Octane plugins in `vite.config.ts`).
- `bun run test` — vitest web tests (jsdom).
- `bun run test:e2e` — transport e2e: starts `xplat dev web` with an isolated
  `XPLAT_DEV_CACHE`, drives Chromium via playwright, and talks to the tweaks
  backend as a Node panel through `@octane-xplat/devtools/client`. Requires
  the repo Go CLI at `research/go-cli/`; restores `src/App.tsrx` after Save.
