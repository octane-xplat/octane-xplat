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
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilter>
	>([])
	return <PowerSearch config={config} filters={filters} onChange={setFilters} />
}
```

Your app holds the current `filters` and updates them through `onChange`.
`PowerSearch` offers field/operator/value suggestions and an editor, then
reports changes as `add`, `edit`, or `remove` with the affected index.
The following component fragment assumes you supply `books` to display the filtered records.

```tsx
import { PowerSearch, Text, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'

const { config, applyFilters } = createPowerSearchConfig([
	{ key: 'title', type: 'string', label: 'Title' },
	{ key: 'year', type: 'number', label: 'Year' },
] as const)

function SearchBooks({ books }: { books: { title: string; year: number }[] }) {
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilter>
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
```

## Portable implementation and upstream seams

The portable implementation provides a controlled token bar, field/operator
suggestions, add/edit/remove flows, clear-all, and a text value editor. English
catalog strings are built in; there is no provider hook for app localization
at this time. The built-in editor handles text, numeric, list, enum, relative
date text, and absolute dates (ISO date input on web, text entry on native).
Date ranges, entity lists, nested values, and app-specific custom values need
an override in `components`.

```tsx
import { useState } from 'octane'
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'

export function Example() {
	const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
	const [filters, setFilters] = useState<
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilter>
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
		ReadonlyArray<import('@octane-xplat/ui').PowerSearchFilter>
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