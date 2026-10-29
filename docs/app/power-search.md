# Structured search

> Add filters such as “Title contains travel” or “Year is greater than 2020.”

A structured search lets someone choose a **field** (such as Year), an
**operator** (such as greater than), and a **value** (such as 2020).
Use `PowerSearch` when your app needs those filters. For a simple text search
or choice list, start with [search and selection](search-selection.md).

```tsx
import { useState } from 'octane'
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'

export function Example() {
	const { config } = createPowerSearchConfig([
		{ key: 'year', type: 'number', label: 'Year' },
	] as const)
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilterFor<typeof config>>
	>([])

	return <PowerSearch config={config} filters={filters} onChange={setFilters} />
}
```

Your app holds the current `filters` and updates them through `onChange`.
`PowerSearch` offers field/operator/value suggestions and an editor, then
reports changes as `add`, `edit`, or `remove` with the affected index.
The `config` carries its field definitions, so `filters` and `onChange`
only accept field, operator, and value combinations the config declares —
`PowerSearchFilterFor<typeof config>` names that union, and a hand-built
`PowerSearchConfig` keeps the loose `PowerSearchFilter`. The following
component fragment assumes you supply `books` to display the filtered
records.

```tsx
import { PowerSearch, Text, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'

const { config, applyFilters } = createPowerSearchConfig([
	{ key: 'title', type: 'string', label: 'Title' },
	{ key: 'year', type: 'number', label: 'Year' },
] as const)

function SearchBooks({ books }: { books: { title: string; year: number }[] }) {
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilterFor<typeof config>>
	>([])

	return (
		<>
			<PowerSearch config={config} filters={filters} onChange={setFilters} />
			<Text>
				{applyFilters(filters, books)
					.map((book) => book.title)
					.join(', ')}
			</Text>
		</>
	)
}
```

## Field definitions and local filtering

The simplified definition types are `string`, `number`, `boolean`, `date`,
`enum`, `enum_list`, and `string_list`. For full control, provide a
`PowerSearchConfig` with field and operator definitions directly. Custom token
and editor components can be supplied through `components` by operator value
type.

```ts
import { createPowerSearchConfig } from '@octane-xplat/ui'

const { config } = createPowerSearchConfig([
	{ key: 'title', type: 'string', label: 'Title' },
	{ key: 'year', type: 'number', label: 'Year' },
	{ key: 'available', type: 'boolean', label: 'Available' },
	{ key: 'published', type: 'date', label: 'Published' },
	{ key: 'genre', type: 'enum', enumValues: [{ value: 'travel', label: 'Travel' }] },
	{ key: 'tags', type: 'string_list', label: 'Tags' },
] as const)
```

Client-side `applyFilters` implements string, numeric, absolute date, enum,
and list comparisons; time, relative-date, entity, custom, and nested values
are not locally evaluated. Use a server-side query for those values.

```tsx
import { createPowerSearchConfig } from '@octane-xplat/ui'

const { applyFilters } = createPowerSearchConfig([{ key: 'year', type: 'number' }] as const)
const visible = applyFilters(
	[{ field: 'year', operator: 'greater_than', value: { type: 'float', value: 2020 } }],
	[{ year: 2019 }, { year: 2026 }],
)
console.log(visible) // [{ year: 2026 }]

// Filters written by hand are checked against the same union — both of
// these fail to compile.
const wrong = applyFilters(
	// 'yeahr' is not a defined field
	[{ field: 'yeahr', operator: 'greater_than', value: { type: 'float', value: 2020 } }],
	[],
)
const mismatch = applyFilters(
	// 'contains' is not a number-field operator
	[{ field: 'year', operator: 'contains', value: { type: 'string', value: 'x' } }],
	[],
)
```

**Migrating existing code:** state or helpers annotated
`ReadonlyArray<PowerSearchFilter>` still work with a hand-built
`PowerSearchConfig`, but a `createPowerSearchConfig` config narrows
`filters`/`onChange`/`applyFilters` to the defined union — switch the
annotation to `PowerSearchFilterFor<typeof config>` (or fix the field or
operator it flags).

## Portable implementation and upstream seams

The portable implementation provides a controlled token bar, field/operator
suggestions, add/edit/remove flows, clear-all, and a text value editor. English
catalog strings are built in; there is no provider hook for app localization
at this time. The built-in editor handles text, numeric, list, enum, relative
date text, and absolute dates (ISO date input on web, text entry on native).
Entity lists, nested values, and app-specific custom values need an override in
`components`. Date ranges also need an override on web/mobile; the experimental
AppKit built-in range form is described [below](#edit-native-appkit-date-ranges).

```tsx
import { useState } from 'octane'
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'

export function Example() {
	const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilterFor<typeof config>>
	>([])

	return (
		<PowerSearch
			config={config}
			filters={filters}
			onChange={(next, action, index) => {
				setFilters(next)
				console.log(action, index)
			}}
			hasClear
		/>
	)
}
```

Native selection uses the shared input and anchored popover. The sibling
Typeahead and Tokenizer APIs are available in the shared UI barrel, but
PowerSearch still uses a local field-suggestion composition rather than those
components. Token wrapping follows the field's normal layout and the native
imperative focus handle focuses and blurs the shared input. Web and AppKit
expose focus/blur handles. Popover
placement currently uses the standard collision policy; the upstream
400–720 CSS-pixel editor sizing and opening-control edge latching are not
implemented. `maxOperatorMenuItems` is accepted for source compatibility but
currently has no effect because this implementation does not show a separate
operator-value suggestion menu. The upstream ref object is adapted to a
callback `handleRef` with `focusTypeahead` and `blurTypeahead`; native focuses
the shared input rather than a separate tokenizer. `statusVariant` controls
attached or detached status styling. AppKit displays its popover content inline
rather than in a positioned floating layer.

```tsx
import { useState, useRef } from 'octane'
import { PowerSearch, createPowerSearchConfig, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilterFor<typeof config>>
	>([])
	const input = useRef<import('@octane-xplat/ui').PowerSearchHandle | null>(null)

	return (
		<>
			<PowerSearch
				config={config}
				filters={filters}
				onChange={setFilters}
				statusVariant="detached"
				handleRef={(handle) => {
					input.current = handle
				}}
			/>
			<Pressable onPress={() => input.current?.focusTypeahead()}>
				<Text>Edit filters</Text>
			</Pressable>
		</>
	)
}
```

## Request initial AppKit search focus

Use `hasAutoFocus` for a newly mounted AppKit search bar. The request waits for
its first attached, visible native input while window/input observation is
available. User activity, a newer responder, blocking, filter editing or removal
cancels it. It does not activate a window. Removing the flag and setting it again
requests focus again; merely unblocking the field does not.

```tsx
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'
const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
export function InitialSearch() {
	return <PowerSearch config={config} filters={[]} onChange={() => {}} hasAutoFocus />
}
```

AppKit uses its native input handle directly; TextInput and TextArea have no
public `hasAutoFocus` prop. Five [object-driver cases](../../packages/ui/src/power-search-focus.macos.mobile.test.tsrx)
and a [manual fixture](../../examples/probes/power-search-focus.macos.tsrx) are
authored, all unrun. Source/fake dispatch does not prove actual AppKit attachment,
focus/notification ordering, caret/IME, modal containment, accessibility or
packaging. Existing inline popover and editor limitations above still apply.


## Edit native AppKit date ranges

The native AppKit built-in editor now accepts the `date_range` operator produced
by a date field's “between” operator. It offers Start and End controls for Now,
a UTC date/time, or a relative amount/unit. A plain date means midnight UTC; a
date-time such as `2026-10-29T12:30:00.000Z` retains time and milliseconds. Give
an interval preset to offer a named quick pick without committing it immediately:

```tsx
import { useState } from 'octane'
import { PowerSearchFilterEditor, Text } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig } from '@octane-xplat/ui'

const config: PowerSearchConfig = { name: 'created', fields: [{
	key: 'created', label: 'Created', operators: [{
		key: 'between', label: 'Between', value: { type: 'date_range',
			intervalDatePresets: [{ label: 'Last 7 days', value: {
				start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' },
			} }],
		},
	}],
}] }
export function RangeForm() {
	const [filter, setFilter] = useState<PartialFilter>({ field: 'created', operator: 'between' })
	return <><PowerSearchFilterEditor config={config} filter={filter} mode="edit"
		onSave={(next) => { if (next) setFilter(next) }}
		onCancel={() => setFilter({ field: 'created', operator: 'between' })} />
		<Text>{JSON.stringify(filter.value)}</Text></>
}
```

Apply validates current drafts and ordering against one current instant. Invalid
calendar dates, incomplete/nonfinite amounts and reversed/overflowing ranges do
not call `onSave`. Apply stays available for revalidation as Now moves; validation
messages update on render and Apply checks again. Now and relative endpoints stay
semantic values instead of being frozen into timestamps. Relative amounts count
back; negative means future. Units use the existing matcher’s fixed durations
(month is 30 days, year is 365 days). An optional `anchorKey` is preserved as
app-owned metadata; the built-in matcher does not resolve named anchors.

```ts
import type { DateTimeRange } from '@octane-xplat/ui'
const range: DateTimeRange = {
	start: { type: 'RELATIVE', backValue: 7, unit: 'day' },
	end: { type: 'NOW' },
}
```

Changing the current filter, field or operator retires its old draft callbacks;
rapid edits are kept before render, and the same draft saves once. Read-only
filter/editor state and disabled/loading PowerSearch block editing; Cancel remains
available. Save waits while an attached input has marked text. Unmount retires
callbacks, and Cancel does not save. These are source paths; native IME/focus and
actual attachment behavior still need qualification.

```tsx
export function LockedRange() {
	return <PowerSearchFilterEditor config={config} filter={{ field: 'created', operator: 'between' }}
		mode="edit" isReadOnly onSave={() => {}} onCancel={() => {}} />
}
```

The form displays UTC regardless of `timezoneID`; use a custom editor for
zone-specific display or expression-string `relativeDatePresets`. Interval presets
are supported. Existing absolute precision and expanded years are preserved on
unchanged saves; typed replacements accept four-digit-year dates/date-times.
Web/mobile date-range built-ins, native entity/nested/custom editors, localization,
and complete cross-target parity remain open. Seven value-model and three editor
compiler cases with mock child controls plus an idle manual fixture are authored,
all unrun. No actual native control, popover sizing, keyboard, IME, VoiceOver,
clock/calendar semantics or clean installed-consumer behavior is qualified.

```sh
pnpm probe run examples/probes/power-search-range.macos.tsrx --target macos --watch
```
