# demos/

Little demo screens in [`packages/demos`](../packages/demos/), inspired by the
[geastack examples catalog](https://github.com/geastack/examples/blob/main/docs/EXAMPLE-CATALOG.md).
Where that catalog proves a framework across `web`/`esp32`/`geaos`/`ios`/`windows`
targets, these prove ours across `web` + `native` — each demo is one shared
`.tsrx` screen exercising a distinct seam.

> **Status:** compile-verified on web (`vite build` + `tsrx-tsc` both targets).
> Not yet run on-device — that's the lab step. Styles live in
> `packages/demos/src/demo.css` (grammar kept inside the NS∩web matrix).

## Mounting

`Gallery` is a self-contained launcher: chip menu on top, selected demo below.
Selection mounts fresh / unmounts on switch — deliberate, so timer cleanup is
observable in the logs.

```ts
// apps/web/src/main.tsrx — swap App for Gallery:
import { Gallery } from '@xplat/demos';
import '@xplat/demos/demo.css';   // after tokens.css
createRoot(document.getElementById('root')!).render(<Gallery />);
```

Same two changes in `apps/native/src/index.ts` (`renderNativeScriptApp(page,
Gallery)`), or add Gallery as a third tab in `App.tsrx`. `@xplat/demos` is
already a declared dep of both apps.

Web-only shortcut that doesn't touch the harness entry:
`apps/web/vite.democheck.ts` + `democheck.html` + `src/democheck.tsrx` mount
Gallery under a separate config — `pnpm -C apps/web exec vite dev|build
--config vite.democheck.ts`.

## The demos

| Demo | File | Catalog inspiration | Why it's uniquely valuable |
|---|---|---|---|
| Counter | `Counter.tsrx` | `counter-jsx`, `reactive-counter` | Smallest possible state→commit cycle. The null-hypothesis probe: when a bigger demo misbehaves, this isolates "is basic reactivity broken?" from everything else. Also the natural mount for measuring commit latency (the `darkMark` pattern from Home). |
| Watch | `WatchFace.tsrx` | `watch`, `watch-date` | Sustained 1 Hz commits — ~3.6k renders/hour makes it a leak/staleness detector no other demo provides. Plus compact centered layout and `Date` formatting with zero DOM globals. |
| Stopwatch | `Stopwatch.tsrx` | `stopwatch-jsx` | Effect lifecycle under load: `setInterval` commit stream + cleanup on gallery unmount (listen for `Stopwatch unmounted — timer dead`), and rapid-fire lap appends through `@for`. Only demo where effect teardown is directly observable. |
| Todo | `Todo.tsrx` | `todo-jsx` | The canonical keyed-mutation stress: insert/remove/toggle through the `List` leaf exercises the managed-ObservableArray splice+refresh patch on native — the operations most likely to desync cells. Also controlled `TextInput` round-trip and `@if` empty-state. `renderItem` is deliberately a per-commit closure: the leaf reads it off the host at `itemLoading`, so this stays correct *and* tests that contract. |
| Tic-Tac-Toe | `TicTacToe.tsrx` | `tic-tac-toe` | Pure derived state — winner computed in render, zero effects. Exercises `@if`/`@else if`/`@else` branching and a 3×3 grid of identical Pressables via `@for` over a wrap container. Deterministic: same tap sequence must always produce the same board on both targets. |
| Dialer | `Dialer.tsrx` | `dialer` | Tap-burst throughput — rapid `onPress`→state→commit round-trips, the input pattern most sensitive to event-dispatch latency. Fixed wrap grid of 12 identical keys; string append/backspace state. |
| List ×500 | `VirtualList.tsrx` | `virtual-list` | Volume stress: 500 recycled cells on native ListView plus prepend/remove-first/reverse on `items` — hammers the driver patch's splice path and cell rebinding at a scale Todo can't reach. Module-level `renderItem` keeps identity stable per the leaf contract. |
| Weather | `Weather.tsrx` | `weather` | Async→state→render seam without a network: simulated fetch (timer + setState) drives a loading→data transition shaped exactly like a real platform-services call, so the pattern is proven before the fetch seam exists. Icon glyphs (☀⛅☁☂❄) double as a live font-coverage check (Q18). |
| Keyframes | `AnimShowcase.tsrx` | `css-animation-showcase` | The only sanctioned animation path (decision #22 — keyframes, ~12 animatable props, no transitions). Toggling `className` starts/stops `demo-pulse`/`demo-spin`/`demo-slide`; tests `animation-fill-mode: forwards` persistence and the no-`alternate` workaround (0/50/100 keyframes). First real content for `demo.css`. |
| Reactivity | `ReactiveProbe.tsrx` | `reactive-*` probes | Reactivity granularity, read from console. Four children — plain-a/plain-b/memo-a/memo-b: bumping A should render parent + *-a children only. A `plain-b` render exposes missing granularity; a `memo-b` render means `memo()` compare is broken — and this is the first *user-level* `memo()` on either target (runtime uses it internally for List/Tabs). |

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

## Findings so far

- **TSRX lexer rejects non-ASCII in raw JSX text.** `<Text>✕</Text>` fails at
  parse (`Unexpected character '✕'`); `{'✕'}` string containers are fine.
  Demos keep all glyphs in string expressions — worth an open-questions row if
  it isn't a known upstream limitation.
- `@if`/`@else if`/`@else` chains and `@for` with `index`/`key` compile clean
  for both targets through the real plugin pipeline (105 modules, web build
  green).
