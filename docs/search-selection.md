# Search, select, and enter tokens

Use `Typeahead` for one selected result, `Tokenizer` for a set of results, and
`ComplexSelector` when the popup needs custom content. These controls share a
`SearchSource`; they do not take `Selector`'s `{ value, label }` options.

## Supply search results

A searchable item has a stable `id` and display `label`. The optional
`auxiliaryData.group` string groups related options. `createStaticSource`
provides case-insensitive substring matching over labels and optional
keywords:

```ts
const source = createStaticSource([
  { id: 'sfo', label: 'San Francisco', auxiliaryData: { group: 'West' } },
  { id: 'nyc', label: 'New York', auxiliaryData: { group: 'East' } },
], { keywords: (item) => [item.id] })
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
    <ColorGrid value={value} onSelect={(next) => { commit(next); close() }} />
  )}
</ComplexSelector>
```

`changeAction` marks the surface busy, applies the next value optimistically,
and restores the previous value if the action rejects. `placement` chooses a
side and `alignment` (`start`, `center`, or `end`) aligns the surface to its
anchor on web, iOS, and Android. The experimental macOS leaf currently renders
the open content inline for both typeahead results and the complex selector; it
does not position an anchored AppKit popover. Use `bind` for the portable
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
