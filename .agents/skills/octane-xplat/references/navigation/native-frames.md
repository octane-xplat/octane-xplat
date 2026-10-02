# NativeScript Frame internals — the traps that cost us days

Niche detail for debugging native nav; not needed for app-level
`navigate`/`goBack` use.

These traps concern native `Frame` stacks inside `TabViewItem`s, such as the
iOS-authentic `UITabBar` path. The shared `Tabs` component is self-drawn and
uses a swapped pane rather than a `TabView`.

```tsx
import { Tabs, Text } from '@octane-xplat/ui'

export function Sections() {
	return <Tabs tabs={[{ title: 'Packing', render: () => <Text>Passport</Text> }]} />
}
```

## Lifecycle ordering (iOS — solved, still load-bearing)

- A `frame.navigate()` issued **before the frame is `loaded`** leaves
  `_executingContext` stuck — every later push queues forever and
  `currentPage` stays undefined. Mount the default page in
  `frame.once('loaded', ...)`, never eagerly.

  ```ts
  // Host.mobile.ts — mount this Frame in the native host after configuring it.
  import { Frame, Page } from '@nativescript/core'

  const frame = new Frame()
  frame.once('loaded', () => frame.navigate({ create: () => new Page() }))
  ```

- `TabViewItem`-hosted frames report `isLoaded=false` after tab-selection
  lifecycle churn. Re-arm before each push:
  `if (!frame.isLoaded) frame.callLoaded?.()` (idempotent).

  ```ts
  // In the framework's existing native Frame owner, after tab lifecycle churn.
  import type { Frame } from '@nativescript/core'

  function rearm(frame: Frame) {
    if (!frame.isLoaded) frame.callLoaded?.()
  }
  ```

- `setCurrent` runs on `viewDidAppear` — page commit lands ~seconds after
  the `NAVIGATE CORE` trace for a frame's first navigation. Anything that
  reads `currentPage`/`backStack` immediately after a push races it —
  poll (`navigatedTo` event, or view-mount checks), never fixed timers.

  ```ts
  // Attach before navigation so the target page reports its committed entry.
  import { Page } from '@nativescript/core'

  const targetPage = new Page()
  targetPage.once('navigatedTo', () => console.log('Target page is current'))
  ```

- `Frame.topmost()` returns the **innermost** frame once nested stacks
  exist — root reads via `getStack('root')`.

  ```ts
  import { getStack } from '@octane-xplat/ui'

  const rootFrame = getStack('root')
  console.log(rootFrame?.currentPage)
  ```

## Android — nested stacks (upstream #11444, framework-owned)

A `Frame` inside a `TabViewItem` on Android had the following failures.
This is the historical failing containment shape, not a recommended app setup:

```ts
import { Frame, TabViewItem } from '@nativescript/core'

const tab = new TabViewItem()
tab.view = new Frame()
```

Observed before the core patch:

- accepts pushes — `NAVIGATE CORE` commits, the pushed page mounts, JS
  state writes happen;
- but `setCurrent` never runs — `currentPage`/`backStack` stay stale;
- `goBack` no-ops; `animated: false` doesn't help;
- a push raced against attach crashes: `IllegalArgumentException: No view
found for id 0x3` (release-build fatal).

Root cause (upstream, #11446): `TabViewBase.onItemsChanged` tore down and
re-added every item whenever `items` was re-assigned — which a reactive
renderer does on every update — recreating the frame's native view
detached from its tab fragment. Transactions then land on a detached child
`FragmentManager`, so `TransitionListener.onTransitionEnd` never reaches
`transitionOrAnimationCompleted → setCurrent`. Filed as
[NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444);
the fix ([NativeScript#11446](https://github.com/NativeScript/NativeScript/pull/11446))
is ported into the Xplat `@nativescript/core` patch.

**Containment:** the framework avoids the structure entirely on Android —
named-stack pushes always live in the route store and render through
`RouteHost` inside the active pane (shared `Tabs` and
`BottomNavigationView` alike), so no fragment transaction runs and the
raced-push crash can't occur. On iOS the registered `UITabBar` Frames do
navigate natively; `route` re-arms `isLoaded` before every push and pop
(both queue on `_processNextNavigationEntry`). Apps that directly host a
`Frame` in a `TabViewItem` rely on the core patch. The `demosweep.ts`
catalog sweep remains gated on Android because it asserts native `Page`
objects; its swap-pane VirtualList check already runs.

## Fragment/page bookkeeping order

`navigate` → fragment transaction → `onCreateView` → transition completes
→ `setCurrent` (flips `currentPage`, pushes `backStack`). Any probe or app
code reading `currentPage` between commit and setCurrent sees the OLD page.
The native sweep waits for `demosPage() != null && find('menu-counter')`
before stepping — that's why.

```ts
// Existing native Frame owner: inspect the committed page, not a fixed delay.
import type { Frame } from '@nativescript/core'

function inspectCommittedPage(frame: Frame) {
	console.log(frame.currentPage, frame.backStack.length)
}
```
