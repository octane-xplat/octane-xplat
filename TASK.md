# Task: systematic pixel-parity verification

## Approved scope

Make "same props → same pixels" a measured invariant instead of a
documented convention. Declarative fixture asserts evaluate real rendered
output on web (Playwright) and iOS (harness sweep step); lint-layer CSS
checks catch the silent-drop class at author time.

Assert vocabulary is **bounds + resolved-style values** — no raster
screenshots in checks; screenshots may be emitted as failure artifacts for
human review only.

## Architecture decisions (from design discussion)

- Harness lives in `packages/app`, not a new package — fixtures must mount
  in the real harness anyway and it reuses the probe machinery
  (`collect`/`find`/`waitFor`/`[assert]`). Extract to `packages/parity`
  later only if app consumers need it.
- Android skipped in the first pass — land web↔iOS green first.
- `goddard_js_repl` skipped — in-app asserts + log scrape suffice.
- Deep tree diffing (leaf-vs-leaf JSON) dropped: leaves are legitimately
  different implementations, so internal-structure diffs are noise. Checks
  compare *measured output*, not tree shape.
- Fixtures mount inside a fixed-size parity stage (~320×200, known origin)
  so absolute bounds are numerically comparable across targets (px≡dip
  post-rewrite).

## Changes — Phase A: web lane + comparator (no devices)

- Add `measureTree(root)` web helper in `packages/app`: walk DOM under the
  fixture root → per element `{id/class, bounds via getBoundingClientRect,
  whitelisted computed styles, text}` → JSON.
- Add a parity-stage screen to the harness: fixed-size container mounting
  one fixture (component + props) at a time.
- Fixtures for `Switch`, `Slider`, `Button` — self-drawn, font-free
  geometry (font metrics are the noise source).
- Extend `apps/web` smoke or add `scripts/parity-web.mjs`: mount each
  fixture, dump measureTree JSON.
- Comparator (`scripts/parity-diff.mjs` or similar): two assert kinds —
  `equal` (same measured value across targets) and `internal` (invariant
  like `thumb.d == track.h − 2·pad`, catches agree-but-wrong). Tolerance
  table + divergence registry keyed `(component, prop, facet)` — the
  registry is what known-limits.md rows become.

Exit: web lane emits stable dumps; comparator flags synthetic diffs
correctly.

## Changes — Phase B: iOS lane

- `measureTree` native leaf: reuse `collect` +
  `getActualSize`/`getLocationOnScreen` + `view.style` reads → same JSON
  shape.
- Mount the parity stage **on the root/test pane, not the demos stack** —
  the parity step must not inherit the NativeScript#11444 nested-stack
  gate even though Android is deferred.
- New `parity` sweep step dumping JSON via the `[assert]` log channel;
  run via `xcrun simctl install/launch`, read sim log.

Exit: iOS dump for the 3 fixtures; report green or every diff registered
in the divergence table.

### Phase B landed differently (2026-09-26)

- `paritysweep.native.ts` waits for `__xplatSweepDone`, pushes `/parity`,
  waits for two identical consecutive dumps (native layout settles over
  multiple passes), writes `Documents/parity-report.json`.
- Divergence registry → simpler target-aware checks: `check(m, target)`.
- The lane caught a real toolchain bug: `apps/native/src/app.css` loaded
  css via `@import` chains — inlined text bypasses `pxToDip`'s
  `xplat-web-only` strip, so `transform: translate(-50%,-50%)` landed as a
  −50dip view offset on `vx-slider-thumb`/`track`/`fill`. Fixed by
  importing css files as JS modules in `apps/native/src/index.ts` (same
  shape as web's `main.tsrx`); the transform now warns on `@import`.
- Second real finding: NS `align-items:stretch` clobbers explicit child
  width (web respects it) — the stage splits fixtures into `flex-start`
  (intrinsic) vs `--fill` (stretch) contexts; documented in
  `docs/css-support-notes.md`.
- One intentional leaf divergence: slider thumb overhangs the track edge
  at min/max on web (−10), clamps flush on native (UISlider semantic).
- Result: `pnpm parity` → 65/65 (web+ios). **Android lane added
  2026-09-26:** same paritysweep path — `ns build android` needs
  `JAVA_HOME=…/openjdk@17` (gradle 8.14.3 fails on Java 25), `adb install`
  + `am start`, report lands in `/data/user/0/…/files/parity-report.json`,
  pulled via `run-as`. `pnpm parity` → 91/91 (web+ios+android).
  Note: `@nativescript/core` parity-report pull needs a debuggable build
  (debug APK is).

## Changes — Phase C: lint-layer CSS enforcement (independent, parallel-ok)

### Phase C landed slimmed (2026-09-26)

- `scripts/gen-css-registry.mjs` — extracts every `cssName` registration
  (+ CssAnimationParser longhands) from the installed `@nativescript/core`
  JS into `scripts/ns-css-registry.json` (117 props @ 9.1.2). Re-run on
  core upgrades via `pnpm gen:css-registry`.
- `scripts/check-css.mjs` — parses shared css with `css-tree` (resolved
  through `@nativescript/core`'s own dep tree — no new root dep), strips
  `xplat-web-only` blocks (line-preserving), and errors on declarations
  NS silently drops. `pnpm check:css`, wired into `pnpm lint`.
- `DROPPED_INTENTIONAL` — the allowlist-with-reasons (`display`,
  `grid-area`, `border-style`, `aspect-ratio`, `user-select`, vendor
  prefixes). 9 intentional drops documented; 0 unsupported remain.
- First audit run found real latent issues: `position`/`inset`/
  `pointer-events`/`overflow` declarations in `.vx-sheet-*` were silently
  dropped on native — moved into `xplat-web-only` where they belong;
  `overflow: hidden` on demo video/camera frames likewise.
- Dropped from scope: selector-grammar restriction (we already write flat
  classes; a restrictor is a rule we'd then maintain) and the dead-rule
  check (needs a live view tree; static approximation is
  false-positive-prone — defer until a real bug justifies it).
- Known blind spot: registered props with divergent *semantics* (percent
  `translate`, stretch-vs-explicit-size, grid child defaults) pass the
  audit — that's what the measured lane (Phases A+B) catches.

## Changes — Phase D: coverage + docs

- Barrel gate: every shared export needs a fixtures entry or an `exempt`
  reason.
- `known-limits.md` rows become the divergence-registry source.
- Ledger entry (decisions.md), testing-reference update, honest
  `desk` vs device-verified marks.

## Constraints

- No CI workflows — web rides `pnpm test`/smoke; iOS rides the sweep
  cadence manually.
- Serialize device sessions (shared sims/ports).
- pnpm only; Conventional Commits; preserve unrelated work.
- Don't edit `CHANGELOG.md` or `docs/status.md` without instruction.
- Each phase ships independently; A+B alone is a working web↔iOS check.
