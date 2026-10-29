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
expanded proportional columns. NativeScript and AppKit currently retain the
data without pinning columns. AppKit data tables now have a horizontal viewport
source path, but pinned positioning is still unimplemented. Native interaction
and accessibility remain unqualified.

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
Table style remains on that content. DOM handlers/attributes and sticky
positioning are not supplied by the viewport. The manual fixture can read
native metrics after a human action; it has not run. Auto/bounded height,
header/body sizing, native wheel/trackpad/RTL, nested scrolling, plugin ref
lifetimes, accessibility and clean packaged consumers remain unqualified.

```sh
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
```
