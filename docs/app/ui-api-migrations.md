# Migrate selection, date, and unit values

This guide updates code to the explicit selection, temporal-value, and unit
contracts in the UI package. Each section shows the new public shape.

## Selection and menu rows

`Selector` selection mode now determines the value and callback type. Single
selection is `string | null`; multiple selection is always a string array.

```tsx
import { useState } from 'octane'
import { Selector } from '@octane-xplat/ui'

export function RegionPicker() {
	const [region, setRegion] = useState<string | null>(null)
	const [regions, setRegions] = useState<string[]>([])
	const options = [{ value: 'sfo', label: 'San Francisco' }]
	return (
		<>
			<Selector selectionMode="single" options={options} value={region} onValueChange={setRegion} />
			<Selector selectionMode="multiple" options={options} value={regions} onValueChange={setRegions} />
		</>
	)
}
```

For disclosure, single-open `Accordion` uses one key or `null`; multiple-open
uses an array and requires `multiple`.

```tsx
<Accordion items={items} open={openKey} onOpenChange={setOpenKey} />
<Accordion multiple open={openKeys} onOpenChange={setOpenKeys} items={items} />
```

Menu data rows now say what they do. Use `action` for a command, `link` for
navigation, `section` to group nested rows, and `separator` for a visual and
semantic break. `checkbox`, `radio-group`, and `submenu` remain explicit kinds.

```tsx
import type { MenuOption } from '@octane-xplat/ui'

const items: MenuOption[] = [
	{ type: 'action', key: 'rename', label: 'Rename', onSelect: rename },
	{ type: 'link', key: 'settings', label: 'Settings', href: '/settings' },
	{ type: 'separator', key: 'break' },
	{
		type: 'section', key: 'export', label: 'Export', items: [
			{ type: 'action', key: 'csv', label: 'CSV', onSelect: exportCsv },
		],
	},
]
```

In compound menus, replace `DropdownMenuDivider`, `ContextMenuDivider`, and
`BreadcrumbMenuDivider` with their matching `*Separator` component. Setting
`hasCloseOnSelect={false}` on an action keeps the menu open after it runs.

```tsx
<DropdownMenu trigger={<Text>Actions</Text>}>
	<DropdownMenuItem label="Rename" onSelect={rename} hasCloseOnSelect={false} />
	<DropdownMenuSeparator />
</DropdownMenu>
```

## Empty values and time domains

Use `null` for an explicitly empty date, time, date-time, range, calendar, or
number value. `undefined` means the value was omitted, so an uncontrolled field
can own its current value. Clearing a controlled input reports `null`; Calendar
reports selected dates and takes `null` to show no current selection.

```tsx
const [date, setDate] = useState<ISODateString | null>(null)
const [quantity, setQuantity] = useState<number | null>(null)

<DateInput label="Date" value={date} onChange={setDate} hasClear />
		<Calendar value={date} onChange={setDate} />
<NumberInput label="Quantity" value={quantity} onValueChange={setQuantity} />
```

Keep calendar dates (`YYYY-MM-DD`) and local wall-clock date-times
(`YYYY-MM-DDTHH:mm[:ss]`) separate from instants. An instant includes `Z` or a
numeric UTC offset; numeric timestamps need an explicit Unix unit.

```tsx
<DateInput value="2026-10-02" onChange={setDate} />
<DateTimeInput value="2026-10-02T14:30" onChange={setLocalDateTime} />
<Timestamp value="2026-10-02T14:30:00Z" />
<Timestamp value={1790951400} valueUnit="unix-seconds" />
```

Picker choice now uses only `presentation`. Remove the old `nativePicker` flag;
`presentation="native"` selects the platform-native input on web and the
shared sheet on iOS and Android. `presentation="adaptive-native"` is the
default, while `popover`, `bottom-sheet`, `adaptive-bottom-sheet`, and the
time-only `text-input` mode choose other supported surfaces.

```tsx
<DateInput label="Date" presentation="native" value={date} onChange={setDate} />
<TimeInput label="Time" presentation="text-input" value={time} onChange={setTime} />
```

## Explicit units

Numeric `Timestamp.value` now requires `valueUnit`. ISO timestamp strings must
name an instant with `Z` or an offset. `Timer.startTimeMs` is Unix
milliseconds, and `autoThresholdSeconds` is a duration in seconds.

```tsx
<Timestamp value={createdAtMs} valueUnit="unix-milliseconds" />
<Timestamp value="2026-10-02T14:30:00-04:00" format="relative" />
<Timer startTimeMs={startedAtMs} />
```

Cached-query durations are milliseconds: rename `staleTime` to
`staleTimeMs` and `maxAge` to `maxAgeMs`. The persisted envelope keeps its
existing shape; its `t` field stores the save time in Unix milliseconds.

```ts
cachedQuery$(['user'], getUserId, fetchUser, {
	staleTimeMs: 60_000,
	persist: { storage, version: 'user-v1', maxAgeMs: 86_400_000 },
})
```

Layout numbers also have distinct contracts: `Stack` and related spacing
props use steps of four density-independent pixels; ordinary numeric `Size`
values and resize dimensions are dips (CSS pixels on web), while `percent()`
is relative to the resize container.

```tsx
<Stack gap={2} />
const sidebar = useResizable({
	defaultSize: pixel(280),
	maxSize: percent(50, { max: pixel(480) }),
})
```
