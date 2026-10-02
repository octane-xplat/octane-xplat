# Search, select, and enter tokens

> Let someone choose from a list or find options by typing.

For a list you already have, use `Selector` for one choice or `MultiSelector`
for several. For results that come from a search, use `Typeahead` for one
choice or `Tokenizer` for several. A **token** is a small labeled item, such
as a selected person or tag. `ComplexSelector` lets you customize the popup.

The search controls use a `SearchSource`, code that supplies search results.
They do not take `Selector`'s simple `{ value, label }` option list.
The [text-entry guide](text-entry.md#control-a-field) explains the value and
change-callback pattern used here.

## Choose from a finite list

Use `Selector` (`Select`) for one key, or `MultiSelector` for an array of keys.
These controls filter the supplied list locally; remote query scheduling and
free-text creation belong in `Typeahead` and `Tokenizer`.

```tsx
<MultiSelector
	options={[
		{ value: 'sfo', label: 'San Francisco', group: 'West', description: 'California' },
		{ value: 'nyc', label: 'New York', group: 'East' },
	]}
	value={regions}
	onValueChange={setRegions}
	searchable
	hasSelectAll
	triggerDisplay="count"
	changeAction={saveRegions}
	onChangeError={showError}
	htmlName="regions"
/>
```

`SelectOption.group` adds headings, and `description` adds supporting text.
Filtering matches labels (or the key when no label exists), case-insensitively.
`onChangeQuery`, `searchPlaceholder`, `emptyText`, and `emptySearchText` customize
query feedback. Select-all toggles only currently filtered, enabled options;
hidden and disabled selections remain intact. `formatValue` receives selected
`{ value, label }` items and overrides the labels/count summary.

`onValueChange` fires immediately. `changeAction` displays the submitted value
optimistically and blocks edits while pending. A rejection restores the previous
value and calls `onChangeError`; a newer externally controlled value is preserved.
Caller-supplied `isLoading` shows progress while retaining selectable existing
options. `isReadOnly` and `isDisabled` prevent disclosure and edits, including
externally requested open state. `htmlName` creates one hidden browser input per
selected key; disabled controls are excluded from submission.

On web, arrows navigate enabled rows; Home/End and PageUp/PageDown navigate the
list. Enter commits, Escape closes and restores trigger focus, and Tab leaves
the surface. Printable keys match options or start a searchable query.
Ctrl/Cmd+A toggles filtered select-all when enabled. IME composition is ignored.
The search clear button has its own keyboard stop. Native controls expose tap,
search, clear, and bulk actions; hardware-keyboard navigation is not implemented.
`maxMenuHeight` bounds the scrolling list (default 280).

Adaptive mobile sheets, badge summaries, standalone labeled Field chrome,
selected-row overlay alignment, and browser top-layer hosting remain follow-ons.
Use `Field` for consistent labels/errors and the platform picker/date-picker
leaves when an OS-native picker is the desired interaction.

## Supply search results

A searchable item has a stable `id` and display `label`. The optional
`auxiliaryData.group` string groups related options. `createStaticSource`
provides case-insensitive substring matching over labels and optional
keywords:

```ts
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

## Choose one result

```tsx
<Typeahead
	label="Assignee"
	searchSource={source}
	value={assignee}
	onChange={setAssignee}
	hasEntriesOnFocus
	hasClear
/>
```

`value` is controlled and is either a complete item or `null`. The selected
label is shown as a `Token`; activate it to edit the query. Escape or leaving
the field without selecting restores the selection. `renderItem` changes
option content, and an item's `element` overrides it. `disabledMessage` keeps
a disabled input discoverable on pointer platforms.

## Choose many or create values

```tsx
<Tokenizer
	label="Regions"
	searchSource={source}
	value={regions}
	onChange={(next, change) => setRegions(next)}
	hasCreate
	maxEntries={5}
	htmlName="regions"
/>
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

## Build a custom picker

`ComplexSelector` owns the labeled trigger, open state, and anchored surface.
Its `children` render function receives the current value, a commit callback,
a close callback, and `{ isOpen, isBusy, triggerId, contentId }`:

```tsx
<ComplexSelector
	label="Color"
	value={color}
	onChange={setColor}
	changeAction={(next) => saveColor(next)}
	triggerLabel={color.name}
>
	{(value, commit, close, state) => (
		<ColorGrid
			value={value}
			onSelect={(next) => {
				commit(next)
				close()
			}}
		/>
	)}
</ComplexSelector>
```

`changeAction` marks the surface busy, applies the next value optimistically,
and restores the previous value if the action rejects. `placement` chooses a
side and `alignment` (`start`, `center`, or `end`) aligns the surface to its
anchor on web, iOS, and Android. The experimental macOS Popover uses the
AppKit anchored popup bridge; typeahead result hosting remains a separate
contract. Hardware keyboard and assistive-technology behavior require native
verification. Use `bind` for the portable
imperative handle (`open`, `close`, `toggle`, `isOpen`).

## Platform boundaries

`bind` replaces React refs: web receives an `HTMLElement`, NativeScript
receives its native view, and macOS receives the AppKit-host element. The
`onKeyDown` escape event is a DOM `KeyboardEvent` on web only; native text
fields do not emit it. `htmlName` is web-only. Native and macOS links open via
the platform URL/deep-link service rather than rendering an HTML anchor.

The `@octane-xplat/ui` root exports these controls on web, iOS, Android, and
macOS. macOS is experimental. Linux uses the web leaves. The maintained
component and parity examples are [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx)
and [the parity fixture](../packages/app/src/parity/fixtures.tsrx).
