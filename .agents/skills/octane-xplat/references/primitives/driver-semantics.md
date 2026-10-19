# Driver semantics — how leaves bind

Niche detail: what the universal driver actually does with the leaf's JSX.
Needed when a leaf misbehaves, not for normal component use.

## Leaf shape

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
import type { ViewProps } from '@octane-xplat/ui'

export function Leaf(props: ViewProps) @{
  <masonview id={props.id} style={{ display: 'flex', flexDirection: 'column' }}>{props.children}</masonview>
}
```

- **Use `masonview` for authored native layout.** The former JSX tags
  `flexboxlayout`, `gridlayout`, `stacklayout`, `absolutelayout`, `docklayout`,
  and `wraplayout` are absent from the shared intrinsic contract. Layout keys
  belong in `style` or CSS classes; former layout attributes warn and drop.
  Shared component props such as `row`, `col`, and `gap` remain component APIs
  and are translated internally; do not forward them as raw intrinsic props.
- **Do not host reconciled siblings directly on `contentview` or `Page`.**
  They have one content slot. Use a multi-child layout host. Existing imperative
  NativeScript `GridLayout` host construction is separate from the authored
  JSX vocabulary; it does not make `<gridlayout>` a supported JSX tag.
- **`className` must reach intrinsics as a space-joined string** — the
  driver applies it via `String(value)`, so a raw array arrives
  comma-joined ("a,b") and matches nothing. `cx()` from `@octane-xplat/lib` flattens
  and joins; every native leaf normalizes `props.className` through it.

- The `@jsxImportSource` pragma MUST be line 1 — any import/comment before
  it may select the wrong JSX types in projects with an older default.
- Hooks import from `'octane'` even on native — the compiler retargets to
  `@nativescript-community/octane`. The native build also aliases
  `octane` → `octane/universal/native` so dep-scanning doesn't vendor the
  DOM runtime.
- `component X` declarations type as `() => Element` in .ts files — cast
  to `UniversalComponent` when passing to `createNativeScriptRoot`.

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
// Contributor example: props remain shared between platform leaves.
import { cx } from '@octane-xplat/lib'
import type { ViewProps } from '@octane-xplat/ui'

export function ClassifiedLeaf(props: ViewProps) @{
  <masonview className={cx('vx-view', props.className)} style={{ display: 'flex', flexDirection: 'column' }}>{props.children}</masonview>
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

## Removing props and inline styles

The patched native driver receives the complete next prop bag, including
static props. Do not merge update bags: a missing key removes its previous
value. A never-applied `undefined` skips the setter; dropped/nullish values
reset registered properties with `unsetValue` and ordinary fields with their
captured original values. Style objects replace their authored keys; removing
an inline override restores matching class CSS.

```tsx
import { View } from '@octane-xplat/ui'

export function Preview({ expanded }: { expanded: boolean }) {
  return <View className="preview" style={expanded ? { width: 240 } : undefined} />
}
// With expanded=false, width comes from the matching .preview class again.
```

The core 9.1 CSS refresh uses an isolated private hook, not a public reset API.
Keep it when refreshing the patch until core provides an equivalent. See the
[implementation note](../../../../docs/notes/primitive-notes.md) and
[upstream PR #14](https://github.com/nativescript-community/octane/pull/14).

## Root creation

`createNativeScriptRoot(hostView).render(Component, props)` creates an
independent root. Use it for bootstrap or intentionally independent content;
framework-owned surfaces, list cells, and routes with an outlet use portals
instead. Do not replace their content owners with new roots.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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

Independent roots do not inherit providers, but can subscribe to the same
module-scope store. A portal keeps its source providers while rendering in
another host. Native host theme classes still need explicit application.

```tsx
import { Text } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

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

Consequence: a bare module-store read (`store.getSnapshot()`) in a child refreshes
on web but goes **stale on native**. The portable rule: **every component
that reads shared state subscribes** — `useStore(store)` /
`useStore(store, select)` from `@octane-xplat/ui` (over
`useSyncExternalStore`; a subscriber is marked dirty and always re-runs).
`createStore(initial)` makes a minimal `{getSnapshot,set,update,subscribe}` store.
Pinned by `packages/ui/src/store.mobile.test.ts` + `store.web.test.tsrx`.

```tsx
import { Text } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

const trip = createStore({ packed: 0 })
export function PackedCount() {
	const packed = useStore(trip, (state) => state.packed)
	return <Text>{packed}</Text>
}
trip.update((state) => ({ ...state, packed: state.packed + 1 }))
```

## Frame/page containers

- `Page` = the nav unit. `page.actionBarHidden = true`, `page.id` set for
  probes.
- Platform tab panes and list cells preserve source context through owned
  portals. Manually constructing a native host does not automatically create
  that ownership; use the maintained components or the documented owner protocol.

See [portal ownership](../../../../docs/notes/portal-boundaries.md) for the
current boundary inventory and [overlays](../overlays.md) for scoped services.
