# Search, select, and enter tokens

> Let someone choose from a list or find options by typing.

For a list you already have, use `Selector` for one choice or `MultiSelector`
for several. For results that come from a search, use `Typeahead` for one
choice or `Tokenizer` for several. A **token** is a small labeled item, such
as a selected person or tag. `ComplexSelector` lets you customize the popup.

```tsx
import { Selector, MultiSelector } from '@octane-xplat/ui'

export function Example() {
	const options = [{ value: 'sfo', label: 'San Francisco' }]
	return (
		<>
			<Selector label="Region" options={options} defaultValue="sfo" />
			<MultiSelector label="Regions" options={options} defaultValue={['sfo']} />
		</>
	)
}
```

The search controls use a `SearchSource`, code that supplies search results.
They do not take `Selector`'s simple `{ value, label }` option list.
The [text-entry guide](text-entry.md#control-a-field) explains the value and
change-callback pattern used here.

```ts
import { createStaticSource } from '@octane-xplat/ui'

// regions-source.ts: share this source between the examples.
export const source = createStaticSource(
	[
		{ id: 'sfo', label: 'San Francisco', auxiliaryData: { group: 'West' } },
		{ id: 'nyc', label: 'New York', auxiliaryData: { group: 'East' } },
	],
	{ keywords: (item) => [item.id] },
)
```

## Choose from a finite list

Use `Selector` (`Select`) for one key, or `MultiSelector` for an array of keys.
These controls filter the supplied list locally; remote query scheduling and
free-text creation belong in `Typeahead` and `Tokenizer`.

```tsx
import { useState } from 'octane'
import { MultiSelector } from '@octane-xplat/ui'

export function Example() {
	const [regions, setRegions] = useState<string[]>([])
	const options = [
		{ value: 'sfo', label: 'San Francisco', group: 'West', description: 'California' },
		{ value: 'nyc', label: 'New York', group: 'East' },
	]
	return (
		<MultiSelector
			label="Regions"
			options={options}
			value={regions}
			onValueChange={setRegions}
			searchable
			hasSelectAll
			triggerDisplay="count"
			changeAction={async (next) => {
				console.log('Save', next)
			}}
			onChangeError={(error) => console.log(error)}
			htmlName="regions"
		/>
	)
}
```

`SelectOption.group` adds headings, and `description` adds supporting text.
Filtering matches labels (or the key when no label exists), case-insensitively.
`onChangeQuery`, `searchPlaceholder`, `emptyText`, and `emptySearchText` customize
query feedback. Select-all toggles only currently filtered, enabled options;
hidden and disabled selections remain intact. `formatValue` receives selected
`{ value, label }` items and overrides the labels/count summary.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Example() {
	return (
		<MultiSelector
			label="Regions"
			options={[{ value: 'sfo', label: 'San Francisco', group: 'West', description: 'California' }]}
			searchable
			hasSelectAll
			searchPlaceholder="Find a region"
			emptyText="No regions yet"
			emptySearchText="No matches"
			onChangeQuery={(query) => console.log(query)}
			formatValue={(items) => `${items.length} regions`}
		/>
	)
}
```

`onValueChange` fires immediately. `changeAction` displays the submitted value
optimistically and blocks edits while pending. A rejection restores the previous
value and calls `onChangeError`; a newer externally controlled value is preserved.
Caller-supplied `isLoading` shows progress while retaining selectable existing
options. `isReadOnly` and `isDisabled` prevent disclosure and edits, including
externally requested open state. `htmlName` creates one hidden browser input per
selected key; disabled controls are excluded from submission.

```tsx
import { useState } from 'octane'
import { MultiSelector } from '@octane-xplat/ui'

export function Example() {
	const [regions, setRegions] = useState<string[]>([])
	return (
		<MultiSelector
			label="Regions"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			value={regions}
			onValueChange={setRegions}
			changeAction={async (next) => {
				console.log('Save', next)
			}}
			onChangeError={(error) => console.log(error)}
			isLoading={false}
			isReadOnly={false}
			isDisabled={false}
			htmlName="regions"
		/>
	)
}
```

On web, arrows navigate enabled rows; Home/End and PageUp/PageDown navigate the
list. Enter commits, Escape closes and restores trigger focus, and Tab leaves
the surface. Printable keys match options or start a searchable query.
Ctrl/Cmd+A toggles filtered select-all when enabled. IME composition is ignored.
The search clear button has its own keyboard stop. Native controls expose tap,
search, clear, and bulk actions; hardware-keyboard navigation is not implemented.
`maxMenuHeight` bounds the scrolling list (default 280).

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Example() {
	return (
		<MultiSelector
			label="Regions"
			options={[
				{ value: 'sfo', label: 'San Francisco' },
				{ value: 'nyc', label: 'New York', isDisabled: true },
			]}
			searchable
			hasSelectAll
			maxMenuHeight={280}
		/>
	)
}
```

Adaptive mobile sheets, badge summaries, standalone labeled Field chrome,
selected-row overlay alignment, and browser top-layer hosting remain follow-ons.
Use `Field` for consistent labels/errors and the platform picker/date-picker
leaves when an OS-native picker is the desired interaction.

```tsx
import { Field, Selector } from '@octane-xplat/ui'

export function Example() {
	return (
		<Field label="Region" status={{ type: 'error', message: 'Choose a region' }}>
			<Selector options={[{ value: 'sfo', label: 'San Francisco' }]} />
		</Field>
	)
}
```

## Supply search results

A searchable item has a stable `id` and display `label`. The optional
`auxiliaryData.group` string groups related options. `createStaticSource`
provides case-insensitive substring matching over labels and optional
keywords:

```ts
import { createStaticSource } from '@octane-xplat/ui'

const source = createStaticSource(
	[
		{ id: 'sfo', label: 'San Francisco', auxiliaryData: { group: 'West' } },
		{ id: 'nyc', label: 'New York', auxiliaryData: { group: 'East' } },
	],
	{ keywords: (item) => [item.id] },
)
```

For remote data, implement `search(query)` and `bootstrap()`. `search` receives
the debounced query; `bootstrap` supplies the optional focus list when
`hasEntriesOnFocus` is true. Return current results from each call. `cancel()`
is called when work is superseded; the component also ignores stale responses.
`minQueryLength` counts grapheme clusters, and `maxMenuItems` bounds the open
list.

```tsx
import { Typeahead } from '@octane-xplat/ui'
import type { SearchableItem, SearchSource } from '@octane-xplat/ui'
import { useState } from 'octane'

let pending: AbortController | undefined
const remote: SearchSource = {
	bootstrap: () => [],
	async search(query) {
		pending?.abort()
		const request = new AbortController()
		pending = request
		const response = await fetch(`/api/people?q=${encodeURIComponent(query)}`, {
			signal: request.signal,
		})
		if (!response.ok) throw new Error('Search failed')
		return (await response.json()) as SearchableItem[]
	},
	cancel() {
		pending?.abort()
	},
}
export function People() {
	const [person, setPerson] = useState<SearchableItem | null>(null)
	return (
		<Typeahead
			label="Person"
			searchSource={remote}
			value={person}
			onChange={setPerson}
			minQueryLength={2}
			maxMenuItems={8}
			debounceMs={250}
		/>
	)
}
```

## Choose one result

```tsx
import { useState } from 'octane'
import { source } from './regions-source'
import { Typeahead } from '@octane-xplat/ui'

export function Example() {
	const [assignee, setAssignee] = useState<import('@octane-xplat/ui').SearchableItem | null>(null)
	return (
		<Typeahead
			label="Assignee"
			searchSource={source}
			value={assignee}
			onChange={setAssignee}
			hasEntriesOnFocus
			hasClear
		/>
	)
}
```

`value` is controlled and is either a complete item or `null`. The selected
label is shown as a `Token`; activate it to edit the query. Escape or leaving
the field without selecting restores the selection. `renderItem` changes
option content, and an item's `element` overrides it. `disabledMessage` keeps
a disabled input discoverable on pointer platforms.

## Choose many or create values

```tsx
import { useState } from 'octane'
import { source } from './regions-source'
import { Tokenizer } from '@octane-xplat/ui'

export function Example() {
	const [regions, setRegions] = useState<import('@octane-xplat/ui').SearchableItem[]>([])
	return (
		<Tokenizer
			label="Regions"
			searchSource={source}
			value={regions}
			onChange={(next, change) => {
				setRegions(next)
				console.log(change.type)
			}}
			hasCreate
			maxEntries={5}
			htmlName="regions"
		/>
	)
}
```

`onChange` receives the new array and a change record (`add`, `create`, or
`remove`). Results already in `value` are filtered. `hasCreate` offers a
`Create "query"` result for free text. Each default `Token` has a remove
button; `renderToken` can replace it. The `tokenOverflowBehavior` options wrap
all tokens (`none`), collapse to a one-line count (`unfocusedInline`), or show
the expanded field in an anchored layer (`unfocusedLayer`).

`htmlName` adds one hidden web form input per selected item, using the item id.
It has no native form equivalent. Backspace removes the last token only on web,
where text key events are available; iOS and Android users remove a token with
its ✕ button.

```tsx
import { useState } from 'octane'
import { source } from './regions-source'
import { Tokenizer } from '@octane-xplat/ui'

export function Example() {
	const [regions, setRegions] = useState<import('@octane-xplat/ui').SearchableItem[]>([])
	return (
		<Tokenizer
			label="Regions"
			searchSource={source}
			value={regions}
			onChange={setRegions}
			htmlName="regions"
		/>
	)
}
```

## Build a custom picker

`ComplexSelector` owns the labeled trigger, open state, and anchored surface.
Its `children` render function receives the current value, a commit callback,
a close callback, and `{ isOpen, isBusy, triggerId, contentId }`:

```tsx
import { ComplexSelector, Pressable, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [color, setColor] = useState('red')
	return (
		<ComplexSelector
			label="Color"
			value={color}
			onChange={setColor}
			changeAction={async (next) => {
				console.log('Save', next)
			}}
			triggerLabel={color}
		>
			{(value, commit, close, state) => (
				<Pressable
					disabled={state.isBusy}
					onPress={() => {
						commit('blue')
						close()
					}}
				>
					<Text>{value} → blue</Text>
				</Pressable>
			)}
		</ComplexSelector>
	)
}
```

`changeAction` marks the surface busy, applies the next value optimistically,
and restores the previous value if the action rejects. `placement` chooses a
side and `alignment` (`start`, `center`, or `end`) aligns the surface to its
anchor on web, iOS, and Android. The experimental macOS Popover uses the
AppKit anchored popup bridge; typeahead result hosting remains a separate
contract. Hardware keyboard and assistive-technology behavior require native
verification. Use `ref` for the portable
imperative handle (`open`, `close`, `toggle`, `isOpen`).

```tsx
import { ComplexSelector, Pressable, Text } from '@octane-xplat/ui'
import { useState, useRef } from 'octane'

export function Example() {
	const [color, setColor] = useState('red')
	const picker = useRef<import('@octane-xplat/ui').ComplexSelectorHandle | null>(null)
	return (
		<ComplexSelector
			label="Color"
			value={color}
			onChange={setColor}
			placement="bottom"
			alignment="start"
			ref={(handle) => {
				picker.current = handle
			}}
			changeAction={async (next) => {
				console.log(next)
			}}
		>
			{(value, commit) => (
				<Pressable onPress={() => commit('blue')}>
					<Text>{value} → blue</Text>
				</Pressable>
			)}
		</ComplexSelector>
	)
}
```

## Platform boundaries

`ref` supplies the handle declared by each component. Primitive containers
supply a host view; search fields and custom selectors supply their own actions. The
`onKeyDown` escape event is a DOM `KeyboardEvent` on web only; native text
fields do not emit it. `htmlName` is web-only. Native and macOS links open via
the platform URL/deep-link service rather than rendering an HTML anchor.

```tsx
import { useState, useRef } from 'octane'
import { source } from './regions-source'
import { Typeahead, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const [region, setRegion] = useState<import('@octane-xplat/ui').SearchableItem | null>(null)
	const input = useRef<import('@octane-xplat/ui').TypeaheadInputHandle | null>(null)
	return (
		<>
			<Typeahead
				label="Region"
				searchSource={source}
				value={region}
				onChange={setRegion}
				ref={(handle) => {
					input.current = handle
				}}
			/>
			<Pressable onPress={() => input.current?.focus()}>
				<Text>Search</Text>
			</Pressable>
		</>
	)
}
```

The `@octane-xplat/ui` root exports these controls on web, iOS, Android, and
macOS. macOS is experimental. Linux uses the web leaves. The maintained
component and parity examples are [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx)
and [the parity fixture](../packages/app/src/parity/fixtures.tsrx).
