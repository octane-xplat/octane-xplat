# Tables and outlines

Use for grouped/tree tables, AppKit cell focus, and Outline navigation. Apply [native interaction prerequisites](accessibility.md) when the workflow depends on AppKit focus or assistive technology.

## Grouped and tree tables

Use the bounded `Table` plugin pipeline for grouped rows, detail panels and
trees; see [group and expand table rows](../../../../../docs/app/tables.md) for complete
examples. Feed `useTableGroupedRows` its post-filter/sort/page data and pass its
returned `data` and `idKey` to Table. Pair `useTableTreeState` with
`useTableTreeData`; sort siblings with `sortSiblings: sortable.applySort`, never
the flattened tree. Row-index numbering follows the data array supplied to
`useTableRowIndex`. IDs must be globally unique within a tree.

```tsx
function ExampleTable() {
  const state = useTableTreeState({ data, idKey: 'id' })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={columns} idKey="id" plugins={{ tree }} />
}
```

AppKit useTableStickyColumns now has an experimental native placement source
path for contiguous start/end runs. Use one instance per data Table. Original
measured cell/row bounds include expanded proportional widths; renderer-owned
constraint offsets and sibling order move existing native cells. RTL edge math,
row clamping, start-side overlap priority and teardown are source paths, not
native input/AX proof. Missing bridge leaves ordinary scrolling. No web shadows
or transitions are supplied. Native pin/order timing, backgrounds, button/field
hit-testing, IME/Tab/VoiceOver and clean packaging require separate verification. Child-composed
tables and other native fallback leaves have no pinning implementation. Web
uses declared minimum-width offsets; use pixels there for exact pinned offsets.

```tsx
function ExampleTable() {
  const sticky = useTableStickyColumns({ startKeys: ['name'], endKeys: ['status'] })
  return <Table data={data} columns={columns} idKey="id" plugins={{ sticky }} />
}
```

AppKit useTableColumnResize now applies current controlled widths to the full
column plan, so header/body/minimum scroll sizing share the override. Removing
it restores the original width; locked columns still accept programmatic
values. Finite nonnegative values are required; invalid visible values reject
the transform under existing plugin error isolation. Unknown keys are ignored.
AppKit now has source-owned header resize handles with drag preview, mirrored
RTL arrows/deltas, Home/End, Escape cancellation, min/max constraints and commit
callbacks. A native splitter role/value/range and AX adjustment source path is
added. With columnWidths present the parent must acknowledge commits; without
it the plugin owns committed widths. The web source retains local overrides
and lacks mirrored RTL deltas; do not claim behavioral parity. Native pan/key/
AX/hit-testing, sticky composition, layout and cleanup require separate verification.

```tsx
import { Table, pixel, useTableColumnResize } from '@octane-xplat/ui'
export function ResizedTable() {
  const resize = useTableColumnResize({ columnWidths: { name: 320 } })
  return <Table data={[{ name: 'Ada' }]} columns={[{ key: 'name', width: pixel(180) }]}
    plugins={{ columnResize: resize }} />
}
```

AppKit data Table now wires textOverflow wrap/truncate to the labels produced
by the shared plan's default body renderer, including mode removal and full-text
retention. A target-only CSS class allows those labels to shrink within their
cell. Keep this owned subset: custom renderCell strings/slots, headers and
children-mode content retain their own behavior. Do not copy non-inherited
text-overflow from the container or rewrite opaque children. Four object-driver
cases and two HMR compiler cases require separate verification; actual Mason row/column
sizing, ellipsis/paint, resize/sticky/input/AX and installed consumers remain
unqualified. See [the table guide](../../../../../docs/app/tables.md#choose-body-text-wrapping-on-appkit).

```tsx
import { Table, pixel } from '@octane-xplat/ui'
export function CompactTrips() {
  return <Table data={[{ name: 'A long weekend in the mountains' }]}
    columns={[{ key: 'name', width: pixel(180) }]} textOverflow="truncate" />
}
```

## AppKit Outline navigation

Outline now uses current native heading target records and NSScrollView geometry
for activation and uncontrolled scroll spy. Pass a raw native viewport through
scrollContainerRef when navigation is outside its scroll ancestor; convert a
ScrollableArea handle with handle.native. Header offset shifts landing and the
spy edge. activeId disables spy, hasScrollOnClick=false keeps callbacks without
seeking, and reduced motion requests an instant seek. Invalid/hidden/detached,
foreign-window and nested-scroll targets are rejected. Generated IDs follow
the discovery allocator but can change with text; prefer authored IDs.

```tsx
import { useCallback, useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type HostElement, type ScrollableAreaHandle } from '@octane-xplat/ui'
export function Contents() {
	const scroll = useRef<HostElement | null>(null)
	const bind = useCallback((handle: ScrollableAreaHandle | null) => { scroll.current = handle?.native ?? null }, [])
	return <>
		<ScrollableArea ref={bind} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		<Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]} scrollContainerRef={scroll} />
	</>
}
```

Native bounds/frame/window notifications own spy/binding updates; user live-scroll
start interrupts navigation. Attempts/timers/observers retire on replacement or
disposal and use current handlers. Completion uses 150 ms bounds quiet, including
a timer fallback when native notifications are absent; it is not an actual
animation-completion guarantee.  Native seeks/coordinate conversion,
scroll spy/animation, interruption/threading, real keyboard/AX and clean packaged
consumers require separate target qualification; see the content-display guide.

## AppKit custom grid-cell focus

The AppKit root `useGridFocus` resolves to a native marked-cell hook. In a macOS
leaf, attach its ref/key handler to a raw native container and mark focusable
native cells with `data-grid-cell`; give cells real actions. Shared component
bags do not promise marker forwarding. This is a presence attribute: false/empty
values still mark; undefined/omission removes it. Positive integer rows/columns
are required. Current native child order supplies indices; columns supplies
vertical stride, arrows clamp rather than wrap, and Home/End find edges.
Selection/activation stays with cells. Do not confuse it with the selector-based
`useGridList`, which still reports false on AppKit.

```tsx
// Palette.macos.tsx
import { useGridFocus } from '@octane-xplat/ui'
export function Palette() {
	const grid = useGridFocus<NSView>({ rows: 1, columns: 2 })
	return <masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="flex flex-row gap-2">
		<button data-grid-cell text="Red" onTap={() => console.log('Red')} />
		<button data-grid-cell text="Blue" onTap={() => console.log('Blue')} />
	</masonview>
}
```

Reuse the renderer metadata reader and existing row focus/Tab/scroll engine.
Nested hook roots and GridList roots own their descendants; preserve nested
text controls, IME, modified/prevented keys and native activation. `focusIndex`
is the last accepted hook target, not a selected ID; successful keyboard moves
notify the current onFocusChange. Optional onFocusCell clamps integer requests
without selection/callback emission and is absent when unavailable/invalid.
Retired callbacks cannot reopen a disposed owner. Native removal remains best
effort; stale observers are inert, and every owned Tab lease is attempted even
after a removal failure. Model cases and the idle manual probe require separate verification;
compiled hooks/marker forwarding, real input/Tab, BOOL, nested focus, scrolling,
RTL/layout, AX, native cleanup and installed consumers require separate target qualification. See
[custom native cells](../../../../../docs/app/components.md#custom-grid-cell-focus-on-appkit).
