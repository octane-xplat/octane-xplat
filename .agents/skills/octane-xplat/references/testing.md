# Testing the harness

## Layers

| Layer     | Command                                                | What it proves                                                                                                                                                          |
| --------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck | `tsrx-tsc --noEmit -p apps/{web,native}/tsconfig.json` | .tsrx typechecks per target                                                                                                                                             |
| Unit      | `pnpm test`                                            | vitest — web config (`*.test.*` + `*.web.test.*`, DOM renderer via jsdom) then `packages/ui` `test:native` (`*.native.test.*`, universal runtime via the object driver) |
| Seam lint | `node scripts/check-no-dom.mjs`                        | no DOM globals in native/shared                                                                                                                                         |
| Web smoke | `cd apps/web && pnpm smoke`                            | build + Playwright, 16 asserts                                                                                                                                          |
| iOS       | build + install + launch → read sim log                | `[assert]` lines, 50/50 expected                                                                                                                                        |
| Android   | build + install + launch → logcat `I JS`               | probes minus gated sweep                                                                                                                                                |

## The probe harness (`apps/native/src/index.ts`)

Timer-scheduled probes fire synthesized gestures/notifications at views:

- `fireGesture(view, type, name, args)` — calls registered gesture
  observers directly (tap=1, pan=8, swipe=16...). NOT coordinate taps —
  it exercises the observer path, not hit-testing.
- `view.notify({eventName:'selectedIndexChanged',...})` for property
  events (tab switch, switch toggle, `textChange` on inputs).
- `find(id)` → `thePage.getViewById(id)`; `collect`/`texts` walk view trees.
- Content asserts: `[assert] name: OK|FAIL` — the pass count is the signal.

**Probes race lifecycle constantly** — the failure mode is always "view
exists but native attach/settle hasn't landed". Fixes are polling, not
bigger timeouts (see the demosweep's `waitFor`).

## The demos sweep (`platform/demosweep.native.ts`)

Drives the demo catalog like a user: switches to Demos tab → per demo:
tap chip → assert pushed page → `goBack` → pop verify → sheet-hosts-demo +
lastDemo store checks. **Gated off Android** (nested-stack pushes crash —
#11444). Web twin is a no-op.

## Web smoke (`apps/web/scripts/smoke.mjs`)

`pnpm smoke` = `vite build && node scripts/smoke.mjs` — serves dist via
`vite preview`, drives headless Chromium (Playwright 1.55). 14 asserts:
mount, state, tab switch, real-path routes, pane render, popstate, deep
link, root-cover, store-across-route, sheet stub, zero pageerrors.

**Selectors:** `Pressable` renders `div[role="button"]` — use
`[role="button"]:has-text("X")`, not `button`.

## Release-build verification

Debug-only signals vanish in release (console.log doesn't reach NSLog on
release iOS). Release verification = process alive + zero fatal exceptions
in the platform log. The one release-only bug we caught:
`RootLayout.open()` unhandled rejection — see overlays.md.

## Universal-renderer unit tests (`vitest.native.config.mts`)

`packages/ui/src/*.native.test.*` run the REAL compiled leaves against
octane's host-neutral object driver (`createUniversalRoot` +
`createObjectDriver` from `octane/universal/native`) — no
`@nativescript/core`, no sim. The config compiles under the nativescript
renderer + aliases `octane` AND `@nativescript-community/octane` to
`octane/universal/native` (the driver index isn't node-loadable). Uses the
raw `octane` plugin from `octane/compiler/vite` with `ssr: false` — vitest
transforms through the SSR pipeline and the renderer is
`server:'unsupported'`; the app-level plugin wrapper doesn't forward `ssr`.
Scheduler/retention semantics get pinned there (see `store.native.test.ts`).

## Adding a probe

1. Give the target view an `id` (probe lookup works by id).
2. Fire the gesture/notify at the view — never assume coordinates.
3. Assert on **view-tree content** (`texts(page)`), not render calls —
   lifecycle ≠ content (the empty-Cell lesson).
4. Poll for async lifecycle (navigatedTo, attach) — fixed timers flake.
