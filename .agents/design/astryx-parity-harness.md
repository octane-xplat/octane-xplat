# Astryx parity harness

> Status: accepted, 2026-10-23. `chrome.css` adopts Astryx's default theme
> (decided 2026-10-23, GH#57); every harness finding is a defect to fix.

Render the same scenarios with Astryx and with Octane Xplat in Chromium, then
compare geometry, computed style, semantics, pixels and scripted behavior. The
harness turns Astryx parity from a source audit into measured web evidence and
gives `tokens.css`/`chrome.css` fixes a repeatable check.

## Location

The harness is a private app in this monorepo, `apps/astryx-parity`
(`@xplat/astryx-parity`), not a separate repository:

- A fix to `packages/ui` and the check that proves it land in one commit;
  the candidate consumes `@octane-xplat/ui` through `workspace:*` source.
- Silo is Git-scoped; parity state stays next to `react_aria_parity` and the
  [Astryx audits](../docs/parity/README.md).
- React 19.3 is already in the lockfile. Astryx ships prebuilt
  `reset.css`/`astryx.css`, so the reference needs no StyleX compiler.

Extract it later only if it becomes a public showcase against published
packages.

## Shape

```
apps/astryx-parity/
  scenarios/       shared scenario data, no JSX — one spec per component
  shared/stage.css identical harness CSS on both sides (page, grid, cells)
  reference/       Vite + React 19 + pinned @astryxdesign/core (reset.css, astryx.css)
  candidate/       Vite + octane() + @octane-xplat/ui (tokens.css, chrome.css)
  sameframe.yaml   structural + pixel comparison of matching routes
  scripts/         build/preview both sides, run sameframe, run behavior probes
```

Both apps serve the same routes. A component route (`/button`) renders a grid
of fixed-size cells, one per scenario, each keyed with
`data-sameframe-key="<component>/<scenario>"`. Fixed cells keep one geometry
difference from shifting every later cell. A behavior route
(`/button/behavior`) renders interactive fixtures that log to
`window.__parity`; the same Playwright probes run on both sides and their
observations are diffed.

| Check | Tool | Notes |
| --- | --- | --- |
| Geometry, computed style, semantics | Sameframe | Matched by parity key; layout/style/semantic findings |
| Pixels | Sameframe | Screenshot-change threshold; a review signal, not the lead |
| Behavior | Playwright probes | Focus order, Enter/Space/click activation, disabled and pending states, ARIA snapshot |

`parity` is not part of `pnpm test` or PR CI; it launches a browser and is
expected to fail until the reported gaps close.

## Fixed inputs

- **Reference:** `@astryxdesign/core` **0.7.1** (published 2026-10-15; the
  newest release past the seven-day age bar on 2026-10-23), core default
  tokens, no theme package. This is the single Astryx pin for all parity
  work; the export inventory was rebased onto it (see the pin section of
  [astryx-parity.md](../docs/parity/astryx-parity.md)). Bump the harness and the
  inventory together.
- **Candidate:** stock `tokens.css` + `chrome.css`, no token overrides.
- **Capture:** Chromium, 1× scale, light scheme, `en-US`, `UTC`, reduced
  motion. Fonts are each library's default system stack, so pixel and text
  metrics are host-dependent; results are qualified for the macOS host that
  produced them.

## Decision: `chrome.css` adopts Astryx's default theme

`chrome.css` is currently a minimal skin — black primary (`#171717`),
`system-ui`, and no Button size geometry (`vx-button--size-*` classes are
emitted but have no rules). Astryx's defaults are a blue accent (`#0064E0`),
28/32/36px control heights, and a `-apple-system` stack. Comparing stock
against stock therefore reports palette, typography and geometry gaps
together.

Decided 2026-10-23 (GH#57): `chrome.css` adopts Astryx's default theme, so
every finding is a defect. The rejected alternative kept the current palette
and applied an Astryx-matched token override to the candidate.

Fixes must stay NativeScript-CSS compatible (for example no
`light-dark()`), because `chrome.css` also styles native targets; this
harness proves web only. Native parity stays chained through `apps/visual`
and the shared parity fixtures.

## Spike scope

Button only: four variants × three sizes, disabled per variant, loading, and
a width-constrained long label. Icons are deferred until both sides can render
the same SVG.

## First run (2026-10-23, macOS host, Chromium)

Three consecutive runs produced identical sameframe findings and identical
behavior diffs. Sameframe: `fail`, 332 findings (10 high). Controls pair by
`data-testid="button/<scenario>/control"`; 14 matches remain uncertain.

Candidate gaps the run surfaced:

- **No size geometry.** Candidate buttons size to their text (44×18 at `sm`)
  at 16px/400/`normal`, against Astryx's 28/32/36px heights at 14px/500/20px.
- **`title="undefined"` on every Button without `tooltip`.** `Button.web`
  passes `web={{ title: props.tooltip }}` and `applyWebProps` assigns
  `el.title = undefined`, which the DOM stringifies. Pointer users see an
  "undefined" tooltip. When the content is only a spinner (loading), the
  accessible name becomes "undefined".
- **Pending and loading state.** Astryx sets `aria-busy`, disables the
  native `<button>`, keeps the label in place, and announces through a
  `status` region. The candidate replaces the content with a `progressbar`
  and exposes neither busy nor disabled state.
- **Element kind.** Candidate Buttons are `div[role=button]`, not `<button>`.

Behavior matches for Tab order, Enter/Space/click activation, the disabled
block, and the ignored re-press while pending.

Probe lesson: Astryx runs `clickAction` in a transition and dedupes presses
until it settles, so probes reload between activations and wait for commits.
Reading state synchronously after an event races both renderers.


## Multi-component coverage (added)

Routes `/text-input`, `/checkbox`, `/switch` join `/button`, each with a
`<route>/behavior` fixture. Scenario data stays JSX-free in `scenarios/` in
Astryx's prop vocabulary; `candidate/main.web.tsx` maps it (`Checkbox`/`Switch`
value→checked, `onChange`→`onCheckedChange`, `CheckboxInput` indeterminate→
`indeterminate` prop). Xplat re-exports `Checkbox` as `CheckboxInput`.
