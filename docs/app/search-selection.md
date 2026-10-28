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
			<Selector selectionMode="single" label="Region" options={options} defaultValue="sfo" />
			<MultiSelector
				selectionMode="multiple"
				label="Regions"
				options={options}
				defaultValue={['sfo']}
			/>
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
`selectionMode` determines both the value and the change callback: `single`
uses one string or `null`, while `multiple` always uses a string array. The
`MultiSelector` preset only accepts `multiple`. These controls filter the
supplied list locally; remote query scheduling and free-text creation belong
in `Typeahead` and `Tokenizer`.

```tsx
import { useState } from 'octane'
import { Selector } from '@octane-xplat/ui'

export function Example() {
	const [region, setRegion] = useState<string | null>(null)
	const options = [
		{ value: 'sfo', label: 'San Francisco', group: 'West', description: 'California' },
		{ value: 'nyc', label: 'New York', group: 'East' },
	]

	return (
		<Selector
			selectionMode="single"
			label="Region"
			options={options}
			value={region}
			onValueChange={setRegion}
			searchable
			changeAction={async (next) => {
				console.log('Save', next)
			}}
			onChangeError={(error) => console.log(error)}
			htmlName="region"
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
			selectionMode="multiple"
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
			selectionMode="multiple"
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
			selectionMode="multiple"
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
`hasEntriesOnFocus` is true. Return current results from each call. Both
methods receive a request whose `signal` aborts when the call is superseded —
each call gets a fresh signal, so sharing one source across components never
cancels a sibling's in-flight request. The component also ignores stale
responses. `minQueryLength` counts grapheme clusters, and `maxMenuItems`
bounds the open list.

```tsx
import { Typeahead } from '@octane-xplat/ui'
import type { SearchableItem, SearchSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const remote: SearchSource = {
	bootstrap: () => [],
	async search(query, request) {
		const response = await fetch(`/api/people?q=${encodeURIComponent(query)}`, {
			signal: request?.signal,
		})
		if (!response.ok) throw new Error('Search failed')

		return (await response.json()) as SearchableItem[]
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
Its `children` render function receives one `ComplexSelectorRenderProps`
context. The context names the (optimistic) `value`, the `onChange` commit
callback, `close`, and the render-state fields `isOpen`, `isBusy`, `triggerId`,
and `contentId`:

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
			{({ value, onChange, close, isBusy }) => (
				<Pressable
					disabled={isBusy}
					onPress={() => {
						onChange('blue')
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
			{({ value, onChange }) => (
				<Pressable onPress={() => onChange('blue')}>
					<Text>{value} → blue</Text>
				</Pressable>
			)}
		</ComplexSelector>
	)
}
```

**Migrating existing code:** `children` previously took four positional
parameters — `(value, onChange, close, state) => …`. It now takes one object,
such as `({ value, onChange, close, isOpen, isBusy }) => …`; fields formerly
accessed through `state` are direct fields on that object.

## Platform boundaries

`ref` supplies the handle declared by each component. Primitive containers
supply a host view; search fields and custom selectors supply their own actions. The
BaseTypeahead `onKeyDown` callback receives a DOM `KeyboardEvent` on web or
Xplat's native key payload on AppKit. The iOS/Android leaves do not forward it. `htmlName` is web-only. Native and macOS links open via
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
component and parity examples are [ComponentsDemo](../../packages/demos/src/ComponentsDemo.tsrx)
and [the parity fixtures](../../packages/ui/src/Typeahead.parity.tsrx).

## Try a small demo

[Try the packing list demo](../demos/packing-list.md) with bundled local content.


## AppKit finite-option selection

Selector's multiple mode and the MultiSelector preset now reach the AppKit
view's checkbox/select-all presentation. Bulk selection includes visible enabled
options and reports arrays. The select-all row exposes mixed state when only
some enabled options are selected; pending, disabled and read-only option hosts
reject selection while the existing state owner coordinates saves and rollback.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector options={[
		{ value: 'email', label: 'Email' },
		{ value: 'push', label: 'Push notifications' },
	]} defaultValue={['email']} hasSelectAll />
}
```

AppKit also uses custom option renderers and single-value trigger renderers.
Plain text results receive a native text host; supplied components keep their
own hosts. When a selected key no longer has an option, the trigger keeps its
summary instead of passing undefined to the custom renderer.

```tsx
import { Selector, Text } from '@octane-xplat/ui'

export function Region() {
	return <Selector options={[{ value: 'west', label: 'West', description: 'Nearby region' }]}
		renderOption={(option) => <Text>{option.label}</Text>}
		renderValue={(option) => <Text>{option.label}</Text>} />
}
```

These changes have authored, unrun object-driver cases. The popup is replaced
with an inline test surface in those cases, so they do not prove NSPopover
ownership or input. A subsequent keyboard/focus source path is described below. Alternate presentations and live-region announcements remain open; ghost chrome
is forwarded in source but native painting remains unqualified;
actual popup focus/input, native layout/VoiceOver and packaging remain unqualified.


## Use Selector keys on AppKit

AppKit Selector now has a source keyboard path. Plain arrows open the popup and
move option focus; Home/End and PageUp/PageDown reach the first/last enabled
choice. Moving focus does not select it. Enter or Space commits the focused
choice, while Escape closes the popup. Disabled choices and pending commits
remain protected. These are authored implementation paths, not a physical-key
verification result.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Fruit() {
	return <Selector options={[
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana', isDisabled: true },
		{ value: 'cherry', label: 'Cherry' },
	]} defaultValue="apple" />
}
```

Typing matches option labels, with repeated-character cycling and a short prefix
window. In a searchable picker, typing outside the editor starts local search
and requests editor focus. Text-editing Home/End/Space and composing input stay
with the editor. Command/Control+A selects visible enabled choices only in an
open multiple picker outside the editor; inside it, the shortcut keeps its
normal text-selection meaning.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Fruits() {
	return <MultiSelector options={[{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }]}
		searchable hasSelectAll />
}
```

The popup uses existing native choice ordering and the layer's focus-return
owner. Tab/Shift+Tab request close and pass the anchor's next/previous valid
key view to that owner, following AppKit's
[key-view ordering](https://developer.apple.com/documentation/appkit/nsview/nextvalidkeyview?language=objc).
This requires the matching keyboard bridge. A host reporting no key dispatch
keeps ordinary option Tab stops instead of suppressing unreachable choices.

The new policy, focus-helper and inline-popup wiring cases remain unrun.
They do not prove real NSPopover focus/return timing, physical keys, IME, modal
FocusScope interactions, scrolling, VoiceOver or packaged operation. The
[maintained AppKit keyboard fixture](https://github.com/octane-xplat/octane-xplat/blob/main/examples/probes/select-keyboard.macos.tsrx)
is also unrun; its script only opens the trigger directly.


## AppKit Selector field metadata

A standalone Selector now renders its label, description and validation message
through the same FormField as other AppKit inputs. An enclosing Field owns that
text instead. The trigger retains its control ID across metadata updates, and
testID reaches the interactive host. Hidden labels keep an accessible name.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Region() {
	return <Selector label="Region" description="Choose the region for this profile" isRequired
		options={[{ value: 'west', label: 'West' }, { value: 'east', label: 'East' }]}
		testID="profile.region" status={{ type: 'error', message: 'Choose a region' }} />
}
```

The ghost variant now forwards its existing chrome class. Field layout,
tooltips, label interaction, native accessibility relationships/announcements
and identifier replay remain unqualified. Alternate picker presentations still need implementation. Removable badges are
described below; native pointer arbitration remains unqualified.

```tsx
import { Selector } from '@octane-xplat/ui'

export function ToolbarRegion() {
	return <Selector accessibilityLabel="Region" variant="ghost" options={[{ value: 'west', label: 'West' }]} />
}
```


## Remove selected values on AppKit

Use `triggerDisplay="badges"` with MultiSelector to show each selected value as a
removable token. Removal uses the same changeAction and rollback as list choices.
Disabled/read-only/pending controls cannot remove values. Unlisted keys keep their
value label and an inert remove control until the option is available again.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector label="Channels" triggerDisplay="badges" defaultValue={['email']}
		options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]} />
}
```

Authored object-driver cases remain unrun. Native badge wrapping, Tab/AX focus,
VoiceOver and physical remove-click isolation from the trigger remain unqualified;
the matching renderer primary-click gate is required. Direct handler dispatch
cannot prove OS hit testing. Alternate picker presentations and live announcements
remain separate gaps.


## Bootstrap AppKit typeahead results on focus

The experimental AppKit BaseTypeahead source now connects input focus to
`hasEntriesOnFocus`. Use it for a small set of initial choices, then let typing
search the same source. `hasAutoFocus` requests initial focus through the queued
AppKit request owner; it never activates a window. Results still render inline
below the field.

```tsx
import { useState } from 'octane'
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }])
export function FindPerson() {
	const [selected, setSelected] = useState<SearchableItem | null>(null)
	return <BaseTypeahead searchSource={people} value={selected} onChange={setSelected}
		hasEntriesOnFocus hasAutoFocus accessibilityLabel="Find a person" />
}
```

Leaving the whole field closes results and cancels pending work. Moving into an
inline result keeps the field alive for its click. New queries retire previous
responses immediately, before debounce; changed sources, blocking state and
teardown also discard late results. Disabled/read-only fields reject edits and
selection. Existing refs read the current native host, and blur leaves unrelated
responders alone.

```tsx
import { useRef } from 'octane'
import { BaseTypeahead, Button, createStaticSource } from '@octane-xplat/ui'
import type { TypeaheadInputHandle } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function SearchAction() {
	const input = useRef<TypeaheadInputHandle | null>(null)
	return <>
		<BaseTypeahead ref={input} searchSource={people} value={null} onChange={() => {}} accessibilityLabel="Person" />
		<Button label="Find Ada" clickAction={() => input.current?.setQuery('Ada')} />
	</>
}
```

Fourteen object-driver cases and a [manual fixture](../../examples/probes/typeahead-focus.macos.tsrx)
are authored, all unrun. Source/fake dispatch does not qualify actual field-editor
focus/blur, IME, click ordering, inline layout, keyboard option navigation,
listbox accessibility or packaged imports. Keyboard selection/consumer keydown
now have a separate source path below; active-option relationships and result
announcements remain gaps. The
AppKit typeahead result host remains separate from the general native Popover.


## Choose AppKit typeahead results with keys

The experimental AppKit input now handles result navigation without moving the
caret to an option. ArrowDown offers results when the closed field has a query
or `hasEntriesOnFocus`. While open, Up/Down wrap the highlight, Home/End reach its
ends, Enter selects, and Escape closes. Tab and Shift+Tab close results while
leaving traversal to AppKit or the containing FocusScope.

```tsx
import { useState } from 'octane'
import { BaseTypeahead, Text, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }])
export function ChoosePerson() {
	const [selected, setSelected] = useState<SearchableItem | null>(null)
	return <>
		<BaseTypeahead searchSource={people} value={selected} onChange={setSelected}
			hasEntriesOnFocus accessibilityLabel="Person" />
		<Text>Selected: {selected?.label ?? 'none'}</Text>
	</>
}
```

BaseTypeahead's optional `onKeyDown` runs before built-in navigation; calling
`preventDefault()` suppresses it. The built-in policy leaves IME, modified text
selection, application shortcuts and ordinary editing keys to AppKit. A current
highlight requests native ancestor scrolling when available, without taking
focus. Consumer callbacks receive the composing flag and should respect it too.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function CustomNavigation() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person"
		onKeyDown={(event) => {
			if (!event.isComposing && event.key === 'ArrowDown') event.preventDefault()
		}} />
}
```

Seven policy and five object-driver cases plus the
[manual key fixture](../../examples/probes/typeahead-keys.macos.tsrx) are authored,
all unrun. These establish source intent only. Real field-editor/IME/repeat,
modifier delivery, Tab/layer ordering, native highlight reveal and packaging
remain unqualified. Results remain inline; listbox/active-option accessibility
and announcements remain gaps. Tokenizer's AppKit Backspace removal is not
wired by this change; use each token's remove button.
