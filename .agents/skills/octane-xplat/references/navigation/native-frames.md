# NativeScript Frame internals — the traps that cost us days

Niche detail for debugging native nav; not needed for app-level
`navigate`/`goBack` use.

## Lifecycle ordering (iOS — solved, still load-bearing)

- A `frame.navigate()` issued **before the frame is `loaded`** leaves
  `_executingContext` stuck — every later push queues forever and
  `currentPage` stays undefined. Mount the default page in
  `frame.once('loaded', ...)`, never eagerly.
- `TabViewItem`-hosted frames report `isLoaded=false` after tab-selection
  lifecycle churn. Re-arm before each push:
  `if (!frame.isLoaded) frame.callLoaded?.()` (idempotent).
- `setCurrent` runs on `viewDidAppear` — page commit lands ~seconds after
  the `NAVIGATE CORE` trace for a frame's first navigation. Anything that
  reads `currentPage`/`backStack` immediately after a push races it —
  poll (`navigatedTo` event, or view-mount checks), never fixed timers.
- `Frame.topmost()` returns the **innermost** frame once nested stacks
  exist — root reads via `getStack('root')`.

## Android — nested stacks broken (upstream #11444)

A `Frame` inside a `TabViewItem` on Android:

- accepts pushes — `NAVIGATE CORE` commits, the pushed page mounts, JS
  state writes happen;
- but `setCurrent` never runs — `currentPage`/`backStack` stay stale;
- `goBack` no-ops; `animated: false` doesn't help;
- a push raced against attach crashes: `IllegalArgumentException: No view
found for id 0x3` (release-build fatal).

Root cause (desk): `TransitionListener.onTransitionEnd` doesn't propagate
from the child `FragmentManager` under `TabViewItem` — completion never
reaches `transitionOrAnimationCompleted → setCurrent`. Filed as
[NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444)
(covers the iOS `isLoaded` strand too).

**Containment:** the framework's Android `Tabs` shell avoids this structure:
it uses a fixed tab row and router-owned per-tab route arrays, then swaps the
active pane. Tab screen-local state resets when switching tabs. Apps that
directly host a `Frame` in a `TabViewItem` still encounter this issue. The
current `demosweep.native.ts` probe remains gated on Android because it reads
native `Page` objects; it has not been adapted to the router-owned pane.

## Fragment/page bookkeeping order

`navigate` → fragment transaction → `onCreateView` → transition completes
→ `setCurrent` (flips `currentPage`, pushes `backStack`). Any probe or app
code reading `currentPage` between commit and setCurrent sees the OLD page.
The native sweep waits for `demosPage() != null && find('menu-counter')`
before stepping — that's why.
