# VirtualList

> Show a long scrolling list while creating only the rows near the screen.

For a short packing list, start with `ScrollableArea` and render every item.
Use `VirtualList` from `@octane-xplat/ui` when a longer list needs to limit
how many rows exist at once. This is called **virtualization**.

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

export function Example() {
  return (
    <VirtualList
      className="item-viewport"
      items={[{ id: 'coat', title: 'Coat' }]}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Text>{item.title}</Text>}
    />
  )
}
```

Give the list a fixed or otherwise limited visible area (its **viewport**),
and give each item a stable, unique **key**, such as its saved ID. Keys let
the list recognize an item after others are added, removed, or reordered.
The example below is a fragment for a screen that already has an `items`
array and a container with a limited height.

```css
.item-viewport {
  height: 320px;
}
```

For the OS's own scrolling lists, see `UITableView` and `RecyclerView` in
[platform
controls](../../.agents/docs/notes/primitive-notes.md#native-control-implementation-map).
Those use a different implementation that recycles native cells.

Each item, header, footer, empty-state and separator content box uses block
flow. Return a child layout when a row needs spacing or alignment; the list
continues to own row measurement and scrolling.

```tsx
import { Text, VirtualList, VStack } from '@octane-xplat/ui'

export function PackingRows() {
  return <VirtualList className="item-viewport" items={[{ id: 'coat', title: 'Coat' }]}
    renderItem={(item) => <VStack gap={1}>
      <Text>{item.title}</Text><Text>Keep in your day bag</Text>
    </VStack>} />
}
```

## Keep identity and state stable

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

export function Example() {
  const items = [{ id: 'coat', title: 'Coat' }]
  const keyFor = (item: (typeof items)[number]) => item.id
  const renderRow = (item: (typeof items)[number]) => <Text>{item.title}</Text>

  return (
    <VirtualList
      className="item-viewport"
      items={items}
      keyExtractor={keyFor}
      renderItem={renderRow}
    />
  )
}
```

Replace the item array when changing data. Do not use array indices as keys
for reorderable data. Keys must be unique strings or finite numbers; duplicate
keys throw. The default extractor reads the item's `id` or `key` property, so
items carrying one of those fields need no `keyExtractor`; items without any
identity throw instead of guessing a position. `getItemType` optionally
distinguishes templates: changing an item's type remounts that row.

```tsx
import { VirtualList, Text, Pressable } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
  const [items, setItems] = useState([
    { id: 'coat', title: 'Coat', kind: 'note' },
    { id: 'shoes', title: 'Shoes', kind: 'note' },
  ])

  return (
    <>
      <Pressable onPress={() => setItems([...items].reverse())}>
        <Text>Reverse order</Text>
      </Pressable>
      <VirtualList
        className="item-viewport"
        items={items}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.kind}
        renderItem={(item) => <Text>{item.title}</Text>}
      />
    </>
  )
}
```

When a row moves far enough outside the visible area, its component is
removed (**unmounted**). When it comes back, a new row component is created.
A row that remains mounted retains its keyed local
state across prepend; a row that leaves the window loses component-local state.
Keep drafts, selection, and other durable row state in an external store keyed
by item ID. On web, iOS, and Android, type-compatible outer cell hosts are
reused and positioned from measured sizes. Their keyed item subtrees still
unmount off-window; reusing a host never retains another item's local state.
The pool keeps at most eight unused hosts in total, and releases all hosts on
emptying or disposal. Other targets retain their existing windowing engines.

```tsx
import { VirtualList, Text, Pressable } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

const selected = createStore<Record<string, boolean>>({})
const items = [{ id: 'coat', title: 'Coat' }]

function Row(props: { id: string; title: string }) {
  const selections = useStore(selected)

  return (
    <Pressable onPress={() => selected.update((s) => ({ ...s, [props.id]: !s[props.id] }))}>
      <Text>
        {selections[props.id] ? 'Packed: ' : ''}
        {props.title}
      </Text>
    </Pressable>
  )
}

const renderRow = (item: (typeof items)[number]) => <Row id={item.id} title={item.title} />

export function Items() {
  return (
    <VirtualList
      className="item-viewport"
      items={items}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
    />
  )
}
```

## Preserve the visible position

The engine measures mounted rows and estimates unvisited rows. Prepending data
and remeasuring rows above a visible keyed anchor preserve that anchor's viewport
position after settling. This requires the anchor to remain in the data with the
same key and type. Removing the anchor has no replacement-anchor guarantee.
Changing width invalidates exact cached sizes and requires new measurements.
Unmeasured rows may change the estimated total extent, so seeks into unknown
rows — whether by pixel, index, or key — are approximate.

```tsx
import { VirtualList, Text, Pressable } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
  const [items, setItems] = useState([{ id: 'coat', title: 'Coat' }])

  return (
    <>
      <Pressable onPress={() => setItems([{ id: 'shoes', title: 'Shoes' }, ...items])}>
        <Text>Prepend shoes</Text>
      </Pressable>
      <VirtualList
        className="item-viewport"
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Text>{item.title}</Text>}
      />
    </>
  )
}
```

## Scroll to a pixel offset

Pass a `ref` to get a `VirtualListHandle` and call `scrollToOffset` to move the
viewport to a content offset — for example to restore a saved scroll position
or jump under scripted navigation. The offset counts down from the top of the
list content, including the header, in px on web and dips/points on native;
values clamp to the scrollable range. Rows between the current and target
windows mount on the next update, so a deep seek is approximate while the
rows it passes remain unmeasured. `handle.native` is the platform scroll
view — the escape hatch for anything the handle does not cover.

```tsx
import { VirtualList, Text, Pressable, type VirtualListHandle } from '@octane-xplat/ui'
import { useRef } from 'octane'

export function Example() {
  const list = useRef<VirtualListHandle | null>(null)
  const items = [{ id: 'coat', title: 'Coat' }]

  return (
    <>
      <Pressable onPress={() => list.current?.scrollToOffset(0, { animated: true })}>
        <Text>Back to top</Text>
      </Pressable>
      <VirtualList
        ref={list}
        className="item-viewport"
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Text>{item.title}</Text>}
      />
    </>
  )
}
```

Calls before the list mounts are no-ops, and the handle clears on unmount.
`{ animated: true }` uses the platform's scroll animation where the leaf
provides one; the default is an instant write.

## Scroll to an item by index or key

`scrollToIndex(index)` seeks by position and `scrollToItem(key)` seeks by the
item's `keyExtractor` key — the key tracks an item across inserts and reorders
while the index only names its current position. Both accept `{ animated }`
plus `align: 'start' | 'center' | 'end'` (default `'start'`) for where the row
lands in the viewport. An unknown key or out-of-range index is a no-op.
Unmeasured rows above the target are estimated, so a deep seek can land short;
call again after the intervening rows measure.

```tsx
import { VirtualList, Text, Pressable, type VirtualListHandle } from '@octane-xplat/ui'
import { useRef } from 'octane'

export function Example() {
  const list = useRef<VirtualListHandle | null>(null)
  const items = [{ id: 'coat', title: 'Coat' }]

  return (
    <>
      <Pressable onPress={() => list.current?.scrollToItem('coat', { align: 'center' })}>
        <Text>Find the coat</Text>
      </Pressable>
      <VirtualList
        ref={list}
        className="item-viewport"
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Text>{item.title}</Text>}
      />
    </>
  )
}
```

See the maintained [interactive example](../../packages/demos/src/VirtualList.tsrx)
for prepend, removal, reverse, resize, empty, restore, and keyed local state.
Header, footer, separator, and empty content use the corresponding render slots.

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

export function Example() {
  return (
    <VirtualList
      className="item-viewport"
      items={[]}
      keyExtractor={(item: { id: string }) => item.id}
      renderItem={(item) => <Text>{item.id}</Text>}
      renderHeader={() => <Text>Packing list</Text>}
      renderFooter={() => <Text>End of list</Text>}
      renderSeparator={() => <Text>—</Text>}
      renderEmpty={() => <Text>Add your first item</Text>}
    />
  )
}
```

On iOS and Android, scroll and row-measurement callbacks queue one window update
at the next native animation frame. Exact row sizes update the prefix index together; estimates
for unvisited rows rebuild after a meaningful type-average change and 120 ms
without scrolling or new measurements. Exact cached sizes use content width,
including when borders or padding make it narrower than the viewport.
A queued correction adds the height change to the live scroll offset, preserving
movement since measurement. Pending measurements and timers are cancelled when
the list is disposed. This scheduling does not change row state ownership.

## Performance and platform limits

Measure scrolling with the row content, device, and data size your app will ship.
Windowed rendering bounds mounted rows; it does not guarantee a frame rate,
maximum row count, or a fixed time to reach a distant item. Variable-height rows
and native momentum scrolling need particular care. Browser geometry checks do
not establish native frame pacing, direct touch input, or accessibility.

Application-level loading and bottom-pinned chat need their own policies. There
is no shared viewability callback, load threshold, sticky-row/grid/masonry layout,
or built-in bottom-pinned chat policy. Use the scroll methods shown above for
explicit navigation. Test prepend behavior, changing heights, empty data, and
returning to the screen with your actual content.

Linux WebKitGTK batches row measurements into the next animation frame to avoid
resize-delivery errors. Linux anchor accuracy and frame pacing remain unqualified.
