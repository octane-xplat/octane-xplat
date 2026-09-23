# demos/

Little demo screens in [`packages/demos`](../packages/demos/), inspired by the
[geastack examples catalog](https://github.com/geastack/examples/blob/main/docs/EXAMPLE-CATALOG.md).
Where that catalog proves a framework across `web`/`esp32`/`geaos`/`ios`/`windows`
targets, these prove ours across `web` + `native` — each demo is one shared
`.tsrx` screen exercising a distinct seam.

> **Status:** verified on iOS sim — all 10 demos mount and render content via
> the `demosweep` probe (see below). Web: `vite build` + dev-transform green,
> plus `tsrx-tsc` clean both targets. Styles: `packages/demos/src/demo.css`
> (grammar kept inside the NS∩web matrix).

## Mounting

`Gallery` is wired in as the **Demos tab** in `App.tsrx` (index 2 — existing
probes at 0/1 unaffected). It's a self-contained launcher: chip menu on top,
selected demo below. Selection mounts fresh / unmounts on switch — deliberate,
so timer cleanup is observable (`Stopwatch unmounted — timer dead` fires on
leaving it).

Web-only entry that doesn't touch the harness: `pnpm -C apps/web exec vite
dev|build --config vite.democheck.ts` (serves `democheck.html` →
`src/democheck.tsrx` mounting `Gallery` alone).

`@xplat/demos` is a declared dep of `apps/web`, `apps/native`, and
`packages/app`. `demo.css` is imported by `apps/native/src/app.css` (`@import`)
and `apps/web/src/main.tsrx`.

## Native sweep probe

`packages/app/src/platform/demosweep.native.ts` (+ `.web.ts` no-op twin)
drives the gallery on-device: switches to tab 2, taps each `menu-*` chip via
the gesture-observer path (same technique as the entry probes), and asserts
demo content in the view tree — `Loading…` before Weather's fake fetch
resolves, `°` after, `500 rows` for the list, etc. It's a module side-effect
import in `App.tsrx`, so it needs no changes to the harness entry.

## The demos

| Demo | File | Catalog inspiration | Why it's uniquely valuable |
|---|---|---|---|
| Counter | `Counter.tsrx` | `counter-jsx`, `reactive-counter` | Smallest possible state→commit cycle. The null-hypothesis probe: when a bigger demo misbehaves, this isolates "is basic reactivity broken?" from everything else. Also the natural mount for measuring commit latency (the `darkMark` pattern from Home). |
| Watch | `WatchFace.tsrx` | `watch`, `watch-date` | Sustained 1 Hz commits — ~3.6k renders/hour makes it a leak/staleness detector no other demo provides. Plus compact centered layout and `Date` formatting with zero DOM globals. |
| Stopwatch | `Stopwatch.tsrx` | `stopwatch-jsx` | Effect lifecycle under load: `setInterval` commit stream + cleanup on gallery unmount, and rapid-fire lap appends through `@for`. Only demo where effect teardown is directly observable. |
| Todo | `Todo.tsrx` | `todo-jsx` | The canonical keyed-mutation stress: insert/remove/toggle through the `List` leaf exercises the managed-ObservableArray splice+refresh patch on native — the operations most likely to desync cells. Also controlled `TextInput` round-trip and `@if` empty-state. `renderItem` is deliberately a per-commit closure: the leaf reads it off the host at `itemLoading`, so this stays correct *and* tests that contract. |
| Tic-Tac-Toe | `TicTacToe.tsrx` | `tic-tac-toe` | Pure derived state — winner and status computed in render, zero effects. A 3×3 grid of identical Pressables via `@for` over a wrap container. Deterministic: same tap sequence must always produce the same board on both targets. |
| Dialer | `Dialer.tsrx` | `dialer` | Tap-burst throughput — rapid `onPress`→state→commit round-trips, the input pattern most sensitive to event-dispatch latency. Fixed wrap grid of 12 identical keys; string append/backspace state. |
| List ×500 | `VirtualList.tsrx` | `virtual-list` | Volume stress: 500 recycled cells on native ListView plus prepend/remove-first/reverse on `items` — hammers the driver patch's splice path and cell rebinding at a scale Todo can't reach. Module-level `renderItem` keeps identity stable per the leaf contract. |
| Weather | `Weather.tsrx` | `weather` | Async→state→render seam without a network: simulated fetch (timer + setState) drives a loading→data transition shaped exactly like a real platform-services call, so the pattern is proven before the fetch seam exists. Icon glyphs (☀⛅☁☂❄) double as a live font-coverage check (Q18). |
| Keyframes | `AnimShowcase.tsrx` | `css-animation-showcase` | The only sanctioned animation path (decision #22 — keyframes, ~12 animatable props, no transitions). Toggling `className` starts/stops `demo-pulse`/`demo-spin`/`demo-slide`; tests `animation-fill-mode: forwards` persistence and the no-`alternate` workaround (0/50/100 keyframes). First real content for `demo.css`. |
| Reactivity | `ReactiveProbe.tsrx` | `reactive-*` probes | Reactivity granularity, read from the rendered tree (`renders=` counters). Verified on-device: bumping A re-renders parent + `plain-a`/`memo-a` only; `plain-b` is skipped **without memo** — the universal runtime prop-diffs children at commit time — and `memo-b` stays `renders=1`. First user-level `memo()` on either target. |

## Coverage map (catalog → here)

| Catalog category | Covered by | Deliberately skipped |
|---|---|---|
| Watch/wearable | WatchFace | analog faces (no canvas yet) |
| Basic JSX apps | Counter, Todo, Stopwatch | `static-card` (subsumed) |
| Canvas/animation | AnimShowcase | `canvas-3d`, `bouncing-balls` — no canvas primitive exists |
| UI components | Dialer, VirtualList | `settings`/`typography` — already harness surfaces |
| Games | TicTacToe | `sky-hop`, `tilt-breakout`, `button-tetris` — need frame loop / sensors / keyboard |
| Device features | Weather (mocked) | camera/voice/hid/maps — need platform-services interfaces (problem #6) |
| Native experiments | — | whole category is renderer experiments, not shared demos |
| Reactive experiments | ReactiveProbe | — |

## Findings so far (lab, iOS sim)

- **`@else if` chains compile wrong for the universal target.** The else
  callback evaluates each `@else if`/`@else` branch as a *statement* —
  `universalValue(...)` results are discarded — then returns an empty plan.
  Net effect: any 3+-branch conditional renders nothing once the first
  condition fails. Present in emitted `bundle.mjs`; upstream-reportable
  (octanejs/octane).
- **Binary `@if`/`@else` works fully on native** — verified on-device via the
  Counter `if-toggle` probe: else arm mounts when the condition starts false,
  swaps to the then arm on flip, and swaps back (`if else mount` / `if then
  swap` / `if else swap` all OK). An earlier version of this doc blamed the
  runtime for a Weather miss that turned out to be probe timing — the sweep
  asserted `°` after the next demo had already mounted.
- **Children-position ternaries also work and swap correctly** — Weather's
  `{days === null ? <Text/> : <View>@for…</View>}` mounts `Loading…` then
  swaps in the forecast on `setDays` (verified). Prefer whichever reads
  better; only `@else if` is off-limits on native today.
- **`{expr}` calling a render function in children position works on both
  targets** — `Gallery` dispatches `{RENDER[demo]()}` and `Cell` does
  `{props.renderItem(item)}`. This is the portable dynamic-mount pattern.
- **TSRX lexer rejects some non-ASCII in raw JSX text.** `<Text>✕</Text>`
  fails at parse (`Unexpected character '✕'`); `{'✕'}` string containers are
  fine (as is `…`/`°` raw — the rejected set isn't simply "non-ASCII").
  Demos keep all glyphs in string expressions.
- **`tsrx-tsc` covers `packages/**` for both targets** — `pnpm typecheck:web`
  / `typecheck:native` are the fast desk check before any lab run.
- **The universal runtime prop-diffs child components at commit time** —
  verified by ReactiveProbe's render ledger: after bumping A, `plain-b`
  stayed at `renders=1` with no `memo()` wrapper, and `memo-b` likewise.
  Children only re-run when props change; `memo` is an explicit-compare
  override, not the skip mechanism.
- Sweep also incidentally verified: effect cleanup on unmount (stopwatch
  interval cleared), per-press state commits under the sweep's 1.4s cadence,
  and `chip-off` class toggling on menu chips.
