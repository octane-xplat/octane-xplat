# @octane-xplat/dnd-kit

Use draggable and droppable Xplat Views on web, iOS, Android, and native macOS (AppKit). The leaf shares
`@dnd-kit/abstract`'s manager, sensor interface, and drag state machine plus
`@dnd-kit/collision` algorithms and `@dnd-kit/state` reactivity. It implements
input and geometry through Xplat primitives; it does not load `@dnd-kit/dom`
on native or use a collection widget's reorder mechanism. This is an Xplat
facade, not a drop-in replacement for the upstream hook signatures.

## Install and reorder

In an Octane Xplat app with `@octane-xplat/ui` and its renderer configured:

```sh
pnpm add @octane-xplat/dnd-kit
```

Import from the root package; web/native/macos export conditions select the platform
implementation. The app keeps one Octane runtime. Native apps also need the
existing `@nativescript-community/octane` and `@nativescript/core` setup.
The AppKit entry ships source, like other macOS leaves; include its `src/**/*.tsx`
and `src/**/*.tsrx` in the macOS renderer transform. The workspace config already
includes these paths. Its entry supplies AbortController/AbortSignal when absent
in JavaScriptCore. macOS WebView apps select the web entry instead.
No leaf CSS build is required; drag feedback uses style objects.

```tsx
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { SortableList } from '@octane-xplat/dnd-kit'

export function Tasks() {
	const [items, setItems] = useState(['alpha', 'beta', 'gamma'])
	return (
		<SortableList
			items={items}
			onReorder={setItems}
			renderItem={(id) => <Text>{String(id)}</Text>}
		/>
	)
}
```

Use `.tsx`/`.tsrx` files inside the app's renderer include globs. IDs must be
stable and unique within a context. `SortableList` creates its own DndContext
and commits a new array only on a successful drop over a different list item.
The caller saves that array. Cancellation, release outside a target, and drops
onto a disabled target leave the order unchanged. The maintained
[example](examples/sortable.tsx) displays the committed order above the rows.

```tsx
// Tasks above owns items; successful drops publish a replacement array.
export function EmptyTasks() {
	const [items, setItems] = useState<string[]>([])
	return <SortableList items={items} onReorder={setItems} renderItem={(id) => <Text>{id}</Text>} />
}
```

## Compose drag and drop

Use `DndContext` around cooperating children. A draggable spreads `ref`,
`onPan`, and `style` onto **one View**; a droppable supplies its `ref`. `ref`
is the Xplat View binding callback, not a DOM ref prop. `useMeasure` observes
layout; live geometry is read again during drag and auto-scroll.

```tsx
import { View, Text } from '@octane-xplat/ui'
import { DndContext, useDraggable, useDroppable } from '@octane-xplat/dnd-kit'

function Card() {
	const drag = useDraggable({ id: 'card', data: { container: 'inbox' } })
	return (
		<View ref={drag.ref} onPan={drag.onPan} style={drag.style}>
			<Text>Move me</Text>
		</View>
	)
}
function Target() {
	const drop = useDroppable({ id: 'done' })
	return (
		<View ref={drop.ref} className="drop-target">
			<Text>{drop.isOver ? 'Release here' : 'Done'}</Text>
		</View>
	)
}
export function Board() {
	return (
		<DndContext
			onDragEnd={({ active, over }) => {
				if (active && over) console.log(active.id, over.id)
			}}
		>
			<Card />
			<Target />
		</DndContext>
	)
}
```

```css
.drop-target {
	min-height: 100px;
}
```

`useDndContext()` subscribes each reader and returns `active`, `over`,
`transform`, and `isDragging`. Event callbacks are `onDragStart`, `onDragMove`,
`onDragOver`, `onDragEnd`, and `onDragCancel`; events add `canceled`.
`onDragEnd` fires only for a completed gesture; check `over` before accepting it.
Set `disabled` on either hook to exclude it. Droppable `accept(source)` can
filter by source data. Unmounting or disabling an active draggable cancels it;
unmounting a target removes it from collision detection. Context disposal
cleans registrations, subscriptions, queued input, and auto-scroll timers.

```tsx
import { Text, View } from '@octane-xplat/ui'
import { useDndContext, useDroppable } from '@octane-xplat/dnd-kit'

// Render inside the Board's DndContext above.
export function Inbox() {
	const context = useDndContext()
	const drop = useDroppable({
		id: 'inbox',
		disabled: false,
		accept: (source) => source.data.container === 'inbox',
	})
	return (
		<View ref={drop.ref} className="drop-target">
			<Text>{context.isDragging ? 'Dragging' : 'Ready'}</Text>
		</View>
	)
}
```

The default detector prefers pointer intersection then shape overlap. Supply
`collisionDetection={closestCenter}` to choose another exported algorithm.
The pan facade uses the dragged View's center as its detection position; it
does not preserve the finger's grab offset. A draggable's own ID is excluded
from drop targets. `SortableContext` declares
item membership for `useSortable`, which combines both hooks; use `arrayMove`
in `onDragEnd` to save an order. Items do not shift to preview their destination
before release; the dragged View translates over the stationary rows.

```tsx
import { useState } from 'octane'
import { Text, View } from '@octane-xplat/ui'
import {
	DndContext,
	SortableContext,
	useSortable,
	closestCenter,
	arrayMove,
} from '@octane-xplat/dnd-kit'

function SortableRow({ id }: { id: string }) {
	const drag = useSortable({ id })
	return (
		<View ref={drag.ref} onPan={drag.onPan} style={drag.style}>
			<Text>{id}</Text>
		</View>
	)
}
export function OrderedTasks() {
	const [items, setItems] = useState(['alpha', 'beta'])
	return (
		<DndContext
			collisionDetection={closestCenter}
			onDragEnd={({ active, over }) => {
				if (!active || !over) return
				const from = items.indexOf(String(active.id))
				const to = items.indexOf(String(over.id))
				if (from >= 0 && to >= 0) setItems(arrayMove(items, from, to))
			}}
		>
			<SortableContext items={items}>
				{items.map((id) => (
					<SortableRow id={id} />
				))}
			</SortableContext>
		</DndContext>
	)
}
```

Cross-container drops work within one DndContext: `active.data` and `over.data`
can identify containers. The caller moves data between its arrays at drop time.
Separate `SortableList` instances each own a context; use the hooks and
`SortableContext` for a board with cooperating lists. Automatic transfer,
placeholder layout, and empty-container insertion are not built in.

```ts
// Add to a cooperating Board's DndContext; app arrays own the transfer.
function recordTransfer(event: import('@octane-xplat/dnd-kit').DragEvent) {
	if (event.active && event.over) {
		console.log(event.active.data.container, event.over.data.container)
	}
}
```

## Auto-scroll

Pass `autoScroll` to DndContext, or `dnd={{ autoScroll }}` to SortableList.
The adapter makes the existing scroll owner explicit:

```ts
import type { AutoScroll } from '@octane-xplat/dnd-kit'

// Supply these live callbacks from the scroll owner in your app.
export function scrollAdapter(owner: {
	bounds: AutoScroll['bounds']
	offsetRef: { current: number }
	maxOffset: () => number
	scrollTo: (offset: number) => void
}): AutoScroll {
	return {
		bounds: owner.bounds,
		offsetRef: owner.offsetRef,
		maxOffset: owner.maxOffset,
		scrollTo: (offset) => {
			const applied = Math.max(0, Math.min(owner.maxOffset(), offset))
			owner.offsetRef.current = applied
			owner.scrollTo(applied)
		},
		axis: 'y',
		threshold: 40,
		speed: 12,
	}
}
```

`owner.bounds()` returns the current measured `{ x, y, width, height }` or null;
`offsetRef` is the scroll owner's `{ current: number }`. `owner.scrollTo`
stands for the owner's existing scroll method. Read current offsets into the
ref on ordinary scroll events, following VirtualList's scrollOffsetRef pattern.
On native, use a View's `getLocationOnScreen` and `getActualSize` or `useMeasure`
for viewport bounds; on web use the corresponding measured viewport bounds.
Keep bounds and offsets in the same coordinate units: native DIPs, web CSS pixels,
and AppKit points. AppKit geometry uses top-left window-content coordinates.
The [macOS example](examples/sortable.macos.tsx) owns an NSScrollView, measures its
clip view, and converts its document offset into top-down points. It initializes
at the document top and handles flipped and unflipped document views.

```ts
// Keep the scroll owner's offset ref in sync with ordinary scrolling too.
function recordScroll(offsetRef: { current: number }, offset: number) {
	offsetRef.current = offset
}
```

The adapter must clamp and update the ref synchronously to the applied offset.
The drag loop scrolls every 16ms while the drag center remains inside the viewport
and near an edge. `threshold` is the edge distance; `speed` is the maximum units
per tick. It remeasures drop targets and compensates the dragged View's visual
translation for scrolling. Scrolling stops on drop, cancel, and disposal.
Only one explicit scroll viewport is supported; do not attach another gesture
handler to the same drag View.

```tsx
// Continue with scrollAdapter above and your app's existing scroll owner.
import { SortableList, type AutoScroll } from '@octane-xplat/dnd-kit'
import { Text } from '@octane-xplat/ui'

export function ScrollingTasks({ autoScroll }: { autoScroll: AutoScroll }) {
	const [items, setItems] = useState(['alpha', 'beta'])
	return (
		<SortableList
			items={items}
			onReorder={setItems}
			dnd={{ autoScroll }}
			renderItem={(id) => <Text>{id}</Text>}
		/>
	)
}
```

## Limits and verification

V1 uses pan input immediately on native gesture begin or web pointer-down.
There is no activation distance, separate handle, keyboard sensor, screen-reader
announcement layer, drag overlay, nested-scroll arbitration, or virtualized
offscreen target discovery. Native pans may compete with ScrollView gestures;
OS gesture arbitration and hit-testing require device verification. Only mounted,
measurable targets participate. Use a separate DndContext in each native renderer
root (pages and sheets do not share context).

Run `pnpm --filter @octane-xplat/dnd-kit typecheck`, `test`, `build`, and
`pack:check`. Core tests use native-shaped geometry and the real abstract core;
they do not establish OS input delivery. The repository probe doctor reports
available runtime targets. Do not infer Android runtime support from a native
library build.
The Web regression runs with `pnpm --filter @xplat/web test`; it drives pointer
events through bound Views and checks both successful drop and cancellation.
The maintained AppKit regression runs with
`pnpm probe run packages/dnd-kit/tests/appkit-scroll.tsrx --target macos`; it uses
action dispatch and checks layer feedback, layout, auto-scroll, and cleanup.

Before the first automated release, the package still needs the one-time npm
stub and trusted publisher setup described in [releases](../../.agents/docs/releases.md).
This change does not publish or configure npm.

Verification: web/native/macOS source typechecks, web/native library builds,
ten core/geometry tests, and packed consumers in Bundler/NodeNext passed.
Chromium pointer-event dispatch and iOS pan-observer dispatch probes passed
for reorder and cancellation. AppKit/JavaScriptCore pan-handler dispatch passed
reorder/cancel plus NSScrollView auto-scroll, translation through layout, and
cancellation cleanup. These establish renderer runtime behavior, not OS gesture
delivery, hit-testing, or scroll gesture arbitration. Android runtime and macOS
WebView drag behavior were not run.
