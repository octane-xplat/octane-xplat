# Driver semantics — how leaves bind

Niche detail: what the universal driver actually does with the leaf's JSX.
Needed when a leaf misbehaves, not for normal component use.

## Leaf shape

```tsrx
/** @jsxImportSource @nativescript-community/octane */
import type { ViewProps } from '@octane-xplat/ui'

export function Leaf(props: ViewProps) @{
  <flexboxlayout id={props.id}>{props.children}</flexboxlayout>
}
```

- **Never host reconciled children on `contentview`** (or `Page`, a
  ContentView): `addViewChild` assigns each child to `.content`, so every
  sibling but the last is silently dropped. Multi-child leaves use
  `flexboxlayout`; imperative `createNativeScriptRoot` hosts use a
  `GridLayout` child (children fill + stack — single-child layout is
  unchanged). `UITableView`/`RecyclerView` cells are driver-owned ContentViews
  — each platform subpath leaf wraps `renderItem` output in a `gridlayout`.
- **`className` must reach intrinsics as a space-joined string** — the
  driver applies it via `String(value)`, so a raw array arrives
  comma-joined ("a,b") and matches nothing. `cx()` (`src/cx.ts`) flattens
  and joins; every native leaf normalizes `props.className` through it.

- The `@jsxImportSource` pragma MUST be line 1 — any import/comment before
  it demotes the file to DOM intrinsics and typecheck explodes.
- Hooks import from `'octane'` even on native — the compiler retargets to
  `@nativescript-community/octane`. The native build also aliases
  `octane` → `octane/universal/native` so dep-scanning doesn't vendor the
  DOM runtime.
- `component X` declarations type as `() => Element` in .ts files — cast
  to `UniversalComponent` when passing to `createNativeScriptRoot`.

```tsrx
/** @jsxImportSource @nativescript-community/octane */
// In packages/ui/src: cx is the leaf-local class normalizer.
import { cx } from './cx'
import type { ViewProps } from './props'

export function ClassifiedLeaf(props: ViewProps) @{
  <flexboxlayout className={cx('vx-view', props.className)}>{props.children}</flexboxlayout>
}
```

## Driver-owned machinery (upstream, since ns-octane 0.2.1)

- `renderItem` on `<listview>` → real recycling cells used by the
  `UITableView`/`RecyclerView` platform subpath components.
- `onX` props → `addEventListener('x')` generically — gesture props map 1:1.
- `checked`/`text` writes are echo-suppressed (driver skips the write-back
  when the change originated natively).
- Validation (`forbiddenGlobals`/`forbiddenImports`) is compile-pipeline
  only — `.tsrx`/`.tsx` under a renderer rule. Plain `.ts` helpers are NOT
  checked — a `document` in a helper slips through (that's what
  `check:no-dom` catches).

## Root creation

`createNativeScriptRoot(hostView).render(Component, props)` — each pushed
Page, modal, sheet host, tab-stack page, and native platform-list cell gets
its own root.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Host.mobile.tsx — the app supplies hostView after creating its native host.
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { GridLayout } from '@nativescript/core'

function Content() {
	return <label text="Trip details" />
}
export function mountContent(hostView: GridLayout) {
	const root = createNativeScriptRoot(hostView)
	root.render(Content, {})
	return () => root.unmount()
}
```

Roots share NOTHING (no context, no store) — cross-root state goes through
module-scope stores, and each root applies its own theme class.

```tsx
import { createStore, useStore, Text } from '@octane-xplat/ui'

const packedCount = createStore(0)
export function Count() {
	const count = useStore(packedCount)
	return <Text>{count} packed</Text>
}
packedCount.set(1) // Every mounted Count subscribes independently.
```

## Child retention — the scheduler divergence to know

On the **universal (native) renderer**, a re-rendering parent retains child
component owners whose props are shallow-unchanged: their render functions
do NOT re-run (upstream `universal-core` adopts the committed subtree —
it powers scoped commits, and context changes DO defeat it correctly).
The DOM renderer re-invokes children React-style; only `memo()` or a
literally identical element bails.

Consequence: a bare module-store read (`store.get()`) in a child refreshes
on web but goes **stale on native**. The portable rule: **every component
that reads shared state subscribes** — `useStore(store)` /
`useStore(store, select)` from `@octane-xplat/ui` (over
`useSyncExternalStore`; a subscriber is marked dirty and always re-runs).
`createStore(initial)` makes a minimal `{get,set,subscribe}` store.
Pinned by `packages/ui/src/store.mobile.test.ts` + `store.web.test.tsrx`.

```tsx
import { createStore, useStore, Text } from '@octane-xplat/ui'

const trip = createStore({ packed: 0 })
export function PackedCount() {
	const packed = useStore(trip, (state) => state.packed)
	return <Text>{packed}</Text>
}
trip.set((state) => ({ ...state, packed: state.packed + 1 }))
```

## Frame/page containers

- `Page` = the nav unit. `page.actionBarHidden = true`, `page.id` set for
  probes.
- `TabViewItem` content is a plain native view — the driver can't parent
  reconciled children into `<tabviewitem>`; each pane is a `GridLayout`
  hosting its own root (or a `Frame` whose page roots on a `GridLayout`
  child for stack panes).
