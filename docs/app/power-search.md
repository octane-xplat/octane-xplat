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
Nested values and app-specific custom values need an override in `components`.
Entity lists and date ranges also need an override on web/mobile. Experimental
AppKit built-ins are described below for [ranges](#edit-native-appkit-date-ranges)
and [entity selection](#edit-native-appkit-entity-filters). For plain text and
bounded numbers, see [AppKit scalar drafts](#validate-native-appkit-numeric-filters).

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
Web/mobile date-range built-ins, complete native entity/nested/custom parity, localization,
and complete cross-target parity remain open. Seven value-model and three editor
compiler cases with mock child controls plus an idle manual fixture are authored,
all unrun. No actual native control, popover sizing, keyboard, IME, VoiceOver,
clock/calendar semantics or clean installed-consumer behavior is qualified.

```sh
pnpm probe run examples/probes/power-search-range.macos.tsrx --target macos --watch
```

## Edit native AppKit entity filters

In a configured native macOS app, use an `entity_list` operator to select people,
customers or other records from a search source. This example opens an owner form,
keeps changes as a draft and displays the saved selection after Apply. Cancel
closes the form without changing the saved filter. Put the component in a screen
in your app; replace the local people source with your app's lookup when ready.

```tsx
import { useState } from 'octane'
import { Button, PowerSearchFilterEditor, Text, VStack } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig } from '@octane-xplat/ui'

const people = [{ id: '1', label: 'Ada' }, { id: '2', label: 'Grace' }]
const config: PowerSearchConfig = { name: 'owners', fields: [{
	key: 'owner', label: 'Owner', operators: [{ key: 'is', label: 'Is', value: {
		type: 'entity_list',
		searchSource: {
			bootstrap: () => people,
			search: (query) => people.filter((person) => person.id === query ||
				person.label.toLowerCase().includes(query.toLowerCase())),
		},
		tokenization: { regex: '[,;\\r\\n]+', sort: true },
	} }],
}] }
export function OwnerForm() {
	const [filter, setFilter] = useState<PartialFilter>({ field: 'owner', operator: 'is' })
	const [editing, setEditing] = useState(true)
	return <VStack gap={2}>
		<Button label="Edit owners" clickAction={() => setEditing(true)} />
		{editing ? <PowerSearchFilterEditor config={config} filter={filter} mode="edit"
			onSave={(next) => { if (next) { setFilter(next); setEditing(false) } }}
			onCancel={() => setEditing(false)} /> : null}
		<Text>{JSON.stringify(filter.value)}</Text>
	</VStack>
}
```

Search and choose rows, remove a token, or clear the selection. With the example's
tokenization config, paste `Ada; Grace` into the separate entry field and choose
**Add entries**, then Apply. Splitting happens on that action, rather than
automatically inside Tokenizer. Entries are trimmed, deduplicated and optionally
sorted by JavaScript string order; without a regex, comma/newline separates them.
Separator capturing groups and zero-width matches do not become entries. The
batch looks up entries serially, preferring exact IDs then unique case-sensitive
labels; fuzzy or ambiguous results require selecting a search row. A failure
leaves the selection and pasted text available for correction or retry.

```ts
// Continuation of the config above: the batch resolves these labels to IDs.
const savedOwnerValue = {
	type: 'entity_list', value: [{ id: '1', label: 'Ada' }, { id: '2', label: 'Grace' }],
} as const
```

Allow free entries only when your domain accepts strings as identities. Without
a search source, existing selections can still be removed or cleared; adding new
ones requires this option. Custom search rows receive their original source data,
but saved filters keep only `id`, `label` and an optional top-level string `photo`.
Auxiliary data and rendered nodes are not stored. Entity values still require
app/backend matching: `applyFilters` does not evaluate them.

```ts
import type { EntityListOperatorValue } from '@octane-xplat/ui'
const tags: EntityListOperatorValue = {
	type: 'entity_list', isArbitraryStringAllowed: true, tokenization: {},
}
```

Bulk work blocks repeat actions, selection edits and Apply. Cancel, replacement,
read-only state or unmount abort it and discard late results, including results
from sources that ignore cancellation. Each lookup receives a fresh request
signal. Pasted input must be added or cleared before Apply, and marked text in
that field blocks submission. A source exception shows a generic retry message.
These paths have seven model and five mocked-control editor cases plus a manual
fixture, all unrun. Native Tokenizer/paste/keyboard/IME/focus/VoiceOver, popover
layout, host cancellation timing and installed consumers remain unqualified.
Web/mobile entity built-ins and complete nested/custom parity remain open.

```sh
pnpm probe run examples/probes/power-search-entities.macos.tsrx --target macos --watch
```

## Validate native AppKit numeric filters

In the AppKit built-in editor, integer and float operators validate the entered
number before calling `onSave`. The form displays configured units and inclusive
minimum/maximum bounds. Use a default operator to choose which comparison opens
when a filter has no operator yet. This component starts a bounded year filter;
enter `1968` and choose Apply to display its saved value. Empty text, `NaN`,
`Infinity`, fractions for integers, and values outside 1800–2100 show an error
without calling `onSave`. Cancel closes the draft without saving it.

```tsx
import { useState } from 'octane'
import { Button, PowerSearchFilterEditor, Text, VStack } from '@octane-xplat/ui'
import type { PartialFilter, PowerSearchConfig } from '@octane-xplat/ui'

const config: PowerSearchConfig = { name: 'years', fields: [{
	key: 'year', label: 'Year', defaultOperator: 'at_least', operators: [{
		key: 'at_least', label: 'At least',
		value: { type: 'integer', minValue: 1800, maxValue: 2100, units: 'publication year' },
	}],
}] }
export function YearFilter() {
	const [filter, setFilter] = useState<PartialFilter>({ field: 'year' })
	const [editing, setEditing] = useState(true)
	return <VStack gap={2}>
		<Button label="Edit year" clickAction={() => setEditing(true)} />
		{editing ? <PowerSearchFilterEditor config={config} filter={filter} mode="edit"
			onSave={(next) => { if (next) { setFilter(next); setEditing(false) } }}
			onCancel={() => setEditing(false)} /> : null}
		<Text>{JSON.stringify(filter.value)}</Text>
	</VStack>
}
```

Numbers accept ordinary decimal/scientific notation such as `-1.5` or `1e3`,
with a dot for the decimal separator. They reject hexadecimal, grouping separators,
trailing text and nonfinite results. Integers must be whole numbers within
JavaScript's exact range (−9007199254740991 to 9007199254740991). Values are never
clamped to fit bounds. Invalid or reversed configured bounds also block Apply.
Locale-specific numeric entry is outside this experimental subset.

```ts
import type { FloatOperatorValue } from '@octane-xplat/ui'
const price: FloatOperatorValue = { type: 'float', minValue: 0, maxValue: 100, units: 'USD' }
// Enter 1.5e1 for 15; 101 is rejected rather than saved as 100.
```

The scalar form keeps rapid edits and resets its draft when the current filter,
field or operator is replaced. Read-only filter/editor state blocks editing and
Apply; stale callbacks and unmount cannot save. An unknown explicit field/operator
disables Apply. Missing operators use the field's configured default, then its
first operator if no matching default exists. Apply waits for the attached input's
marked text, and a draft submits once; a throwing save callback permits retry.
Cancel retires the session; remount or replace the filter to reopen it. These
ownership paths also cover ordinary text filters; string completions, list/time/
relative/custom validation and richer enum/date editors still need separate
coverage or custom editors.

```tsx
// Inside YearFilter's return, use this editor to block editing and Apply while keeping Cancel.
<PowerSearchFilterEditor config={config} filter={filter} mode="edit" isReadOnly
	onSave={() => {}} onCancel={() => setEditing(false)} />
```

Five numeric model and five mocked-control scalar cases plus a manual fixture are
authored, all unrun. Source/syntax review does not prove actual text/keyboard/IME,
focus, VoiceOver, popover layout or installed-consumer behavior. The fixture also
lets a maintainer replace text/number filters and try missing keys; run it only
when native verification is authorized.

```sh
pnpm probe run examples/probes/power-search-scalars.macos.tsrx --target macos --watch
```
