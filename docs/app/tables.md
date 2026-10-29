# Group and expand table rows

> Group related records, expand details, and keep table rows identifiable.

Use `Table` for a bounded list of records. Give every record a stable ID so
expansion and selection survive sorting. For large virtualized grids, use
the separate [table package](../../packages/table/README.md).

```tsx
import { Table } from '@octane-xplat/ui'

const data = [{ id: '1', name: 'Ava', team: 'Design' }]
const columns = [{ key: 'name', header: 'Name' }, { key: 'team', header: 'Team' }]

export function People() {
  return <Table data={data} columns={columns} idKey="id" />
}
```

## Collapsible groups

`useTableGroupedRows` inserts a header before each group. Pass its returned
`data` and `idKey` to the table, and its `plugin` in the plugin record. Keep
grouping after filtering and sorting; sorting the flattened result would
separate members from their headers.

```tsx
import { useState } from 'octane'
import { Table, useTableGroupedRows } from '@octane-xplat/ui'

const data = [{ id: '1', name: 'Ava', team: 'Design' }]
const columns = [{ key: 'name', header: 'Name' }]

export function Teams() {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const grouped = useTableGroupedRows({
    data,
    groupBy: person => person.team,
    getRowKey: person => person.id,
    collapsedGroups,
    onToggleGroup: key => setCollapsedGroups(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    }),
  })
  return <Table data={grouped.data} columns={columns} idKey={grouped.idKey}
    plugins={{ grouped: grouped.plugin }} />
}
```

## Nested records

`useTableTreeState` owns expansion and computes visible rows from `children`.
`useTableTreeData` draws the controls. For sorting, pass the sortable-state
hook's `applySort` as `sortSiblings`; this keeps children under their parent.
IDs must be unique throughout the tree. Ancestor cycles are skipped.

```tsx
import { Table, useTableTreeState, useTableTreeData } from '@octane-xplat/ui'

type Entry = { id: string; name: string; children?: Entry[] }
const data: Entry[] = [{ id: 'src', name: 'src', children: [
  { id: 'src/index.ts', name: 'index.ts' },
] }]

export function Files() {
  const state = useTableTreeState({ data, idKey: 'id', defaultExpandedIds: ['src'] })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={[{ key: 'name', header: 'Name' }]}
    idKey="id" plugins={{ tree }} />
}
```

## Detail panels, numbering, and status

`useTableRowExpansion` adds a toggle and a detail panel. `useTableRowIndex`
numbers the supplied view, so pass the post-filter, post-sort, post-page data.
`useTableRowStatus` adds a labelled semantic icon or a custom color marker.

```tsx
import { useState } from 'octane'
import { Table, Text, useTableRowExpansion, useTableRowIndex, useTableRowStatus } from '@octane-xplat/ui'

const data = [{ id: '1', name: 'Build core', failed: true }]

export function Builds() {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const expansion = useTableRowExpansion({
    expandedKeys,
    getRowKey: item => item.id,
    onToggle: key => setExpandedKeys(previous => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    }),
    renderExpanded: item => <Text>{`Details for ${item.name}`}</Text>,
  })
  const index = useTableRowIndex({ data })
  const status = useTableRowStatus<(typeof data)[number]>({
    getStatus: item => ({ status: item.failed ? 'error' : 'success', label: item.failed ? 'Failed' : 'Passed' }),
  })
  return <Table data={data} columns={[{ key: 'name', header: 'Name' }]} idKey="id"
    plugins={{ index, status, expansion }} />
}
```

## Sticky columns on web

`useTableStickyColumns` pins a contiguous run through the last `startKeys`
column and from the first `endKeys` column. Synthetic gutter columns in those
runs are pinned too. Use pixel widths for multiple pinned columns: offsets
use declared pixel widths or proportional minimums, rather than measuring
expanded proportional columns. NativeScript retains the data without
pinning columns. AppKit now has a native placement source path described below;
its measured offsets, interaction and accessibility remain unqualified.

```tsx
import { Table, pixel, useTableStickyColumns } from '@octane-xplat/ui'

const data = [{ id: '1', name: 'Ava', email: 'ava@example.com' }]

export function PinnedPeople() {
  const sticky = useTableStickyColumns({ startKeys: ['name'] })
  return <Table data={data} idKey="id" columns={[
    { key: 'name', header: 'Name', width: pixel(180) },
    { key: 'email', header: 'Email', width: pixel(500) },
  ]} plugins={{ sticky }} />
}
```


## Wide data tables on AppKit

AppKit data tables now have an experimental horizontal NSScrollView source
path. Constrain the surrounding container to make wide columns overflow.
Pixel widths stay fixed; proportional widths share remaining space with their
declared minimums. The viewport measures its clip width and preserves the
render plan's minimum content width. Child-composed tables retain their
existing flow and are outside this automatic viewport subset.

```tsx
import { Table, View, pixel, proportional } from '@octane-xplat/ui'
export function People() {
  return <View style={{ width: 360, maxWidth: '100%' }}><Table
    data={[{ name: 'Ada', team: 'Platform' }]}
    columns={[
      { key: 'name', header: 'Name', width: pixel(180) },
      { key: 'team', header: 'Team', width: proportional(1, { minWidth: 300 }) },
    ]}
  /></View>
}
```

AppKit honors scroll-wrapper plugin styles/classes, before/after content and
native NSScrollView refs. Table's public ref binds to its inner table view;
Table style remains on that content. DOM handlers/attributes are not supplied by the viewport. Sticky positioning
uses the separate AppKit hook source path below. The manual fixture can read
native metrics after a human action; it has not run. Auto/bounded height,
header/body sizing, native wheel/trackpad/RTL, nested scrolling, plugin ref
lifetimes, accessibility and clean packaged consumers remain unqualified.

```sh
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
```


Controlled column widths on AppKit now update the column plan before header,
body and minimum scroll width are calculated. Removing an override restores
the original definition, including a proportional width. Controlled values
must be finite and nonnegative; invalid visible-column values reject the
resize transform through Table's existing plugin-error isolation. Unknown keys
are ignored. Programmatic writes do not emit onColumnResizeEnd. AppKit now has experimental
resize handles governed by minWidth, maxWidth and resizable, described below.
Actual native alignment and updates remain unqualified.

```tsx
import { Table, pixel, useTableColumnResize } from '@octane-xplat/ui'
export function WideName() {
  const columnResize = useTableColumnResize({ columnWidths: { name: 320 } })
  return <Table data={[{ name: 'Ada' }]} columns={[{ key: 'name', width: pixel(180) }]}
    plugins={{ columnResize }} />
}
```


## Choose body text wrapping on AppKit

In an experimental native macOS data table, use `textOverflow="truncate"` to
keep default-rendered body text on one line and request a tail ellipsis. Use
`"wrap"`, or omit the prop, to allow word wrapping. The complete value stays in
the native label. Keep a bounded column width so the text has an edge to reach.
Native measurement, painting and installed-app checks for this source path are
still pending.

```tsx
import { Table, pixel } from '@octane-xplat/ui'

export function TripTable(props: { compact: boolean }) {
  return <Table data={[{ id: '1', name: 'A long weekend in the mountains' }]}
    idKey="id" columns={[{ key: 'name', header: 'Trip', width: pixel(180) }]}
    textOverflow={props.compact ? 'truncate' : 'wrap'} />
}
```

This setting owns the text that the default body renderer creates. Custom
`renderCell` content, headers and child-composed cells keep their own text
behavior. For example, a custom `Text` cell can choose its own `maxLines`.
Changing the table setting preserves those custom owners; it does not inspect
or rewrite their children. Long unbroken words, variable row height, resize,
sticky columns, copying/selection and VoiceOver still need native checks.

```tsx
import { Table, Text, pixel } from '@octane-xplat/ui'

export function CustomTripTable() {
  return <Table data={[{ name: 'A long weekend in the mountains' }]}
    columns={[{ key: 'name', width: pixel(180),
      renderCell: trip => <Text maxLines={2}>{trip.name}</Text> }]}
    textOverflow="truncate" />
}
```

## Sticky columns on AppKit

The AppKit hook now has an experimental native source path for the same
contiguous start/end runs. It measures original row/cell bounds, including
expanded proportional widths, rather than using declared minimums as offsets.
It modifies native layout constraints and sibling order for the existing cells.
Use one hook instance per data Table; child-composed tables remain outside this
subset. Older hosts without the placement bridge keep ordinary scrolling.

```tsx
import { Table, View, pixel, useTableStickyColumns } from '@octane-xplat/ui'
export function PinnedPeopleOnAppKit() {
  const sticky = useTableStickyColumns({ startKeys: ['name'], endKeys: ['status'] })
  return <View style={{ width: 420 }}><Table
    data={[{ name: 'Ada', team: 'Platform', status: 'Active' }]}
    columns={[
      { key: 'name', width: pixel(180) },
      { key: 'team', width: pixel(400) },
      { key: 'status', width: pixel(140) },
    ]} plugins={{ sticky }}
  /></View>
}
```

Source calculations mirror physical edges for RTL and clamp cells to their row.
Start cells take priority when pinned regions overlap. Cells retain their native
views; opaque native backgrounds can composite the row overlay variable.
Web pseudo-element shadows and transitions are not implemented. Scroll, clip/
document resize and window updates synchronize placements without a JS frame
loop. Disabling/removing the hook, hiding/detaching cells or replacing the
viewport releases owned placement and restores layout/order.

```sh
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
```

Three simulated native-pin/order cases, six geometry/observer cases and two compiler
cases are authored but unrun. Actual Auto Layout timing, RTL/native leading
anchors, sibling ordering, button hit-testing, text editing/IME, focus/Tab,
background compositing, scrolling performance, VoiceOver and packaged consumers
remain unqualified. The fixture includes pinned buttons and text fields for
those checks; mounting or simulated callbacks cannot prove them.


## Resize columns on AppKit

The AppKit plugin now supplies native header handles for unlocked columns.
Drag horizontally, use Left/Right for ten-point steps, or Home/End for finite
limits. RTL mirrors physical drag/key directions. Escape cancels a drag;
locking/removing a handle, replacing its native window or changing the active
controlled width retires its preview. Native splitter role/value/range and
increment/decrement actions have source paths. None of these interactions is
runtime-qualified yet.

```tsx
import { useState } from 'octane'
import { Table, pixel, useTableColumnResize } from '@octane-xplat/ui'
export function ResizablePeople() {
  const [widths, setWidths] = useState<Record<string, number>>({})
  const resize = useTableColumnResize({ columnWidths: widths, onColumnResizeEnd: setWidths,
    minWidth: 80, maxWidth: 520 })
  return <Table data={[{ name: 'Ada' }]} columns={[{ key: 'name', width: pixel(180) }]}
    plugins={{ columnResize: resize }} />
}
```

Use one plugin instance per data Table. With columnWidths present, drag previews
retire at commit and the parent must save the returned map to accept changes.
Without columnWidths, committed widths stay in the plugin. Pointer cancellation
does not emit a commit; keys and accessibility adjustments commit immediately.
The current web implementation retains local gesture widths and does not mirror
RTL deltas, so unacknowledged controlled updates and RTL behavior differ by
source implementation. Cross-target parity remains unresolved; native proof
must not be inferred from the web leaf.

```tsx
import { useTableColumnResize } from '@octane-xplat/ui'
export function useLocalWidths() {
  return useTableColumnResize({ minWidth: 80, maxWidth: 520 })
}
```

Bounds default to a minimum of 50 points and no maximum. Invalid/nonfinite
minimums use the default; finite limits are normalized to nonnegative minimum
and maximum at least minimum. Programmatic widths may lie outside gesture
limits. Six interaction-state cases, one simulated splitter case and two new
handle compiler cases are authored but unrun. Native drag delivery/cancellation,
keyboard focus/Tab, VoiceOver, sorting versus handle hit-testing, sticky-column
composition, repeated layout, teardown and packaged consumers remain unqualified.


```tsx
import { useTableColumnResize } from '@octane-xplat/ui'
export function useNarrowName() {
  return useTableColumnResize({ columnWidths: { name: 40 }, minWidth: 80, maxWidth: 520 })
}
```
