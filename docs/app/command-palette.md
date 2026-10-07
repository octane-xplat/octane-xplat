# Search commands across targets

> Use one command search contract with a keyboard palette on web and macOS
> and a touch-first search sheet on iOS and Android.

`CommandPalette` accepts either static `items` or a `searchSource`. Existing
`MenuItem` arrays still work. Supply stable, unique keys/IDs and keep `open`
controlled with `onOpenChange`; omitting the callback does not provide an
uncontrolled opener. An internal close also hides the current surface and
invalidates pending results. Set `open` false before reopening it.

## Static commands

```tsx
import { CommandPalette, Text } from '@octane-xplat/ui'

;<CommandPalette
	open={isOpen}
	onOpenChange={setIsOpen}
	label="Workspace commands"
	items={[
		{
			key: 'settings',
			label: 'Settings',
			group: 'Navigation',
			keywords: ['preferences'],
			description: 'Manage workspace preferences',
			onSelect: openSettings,
		},
		{ key: 'delete', label: 'Delete workspace', group: 'Actions', disabled: true },
	]}
	searchMode="fuzzy"
	onValueChange={(id) => setLastCommand(id)}
	footer={<Text>Choose a command</Text>}
/>
```

Here `isOpen`, `setIsOpen`, `openSettings`, and `setLastCommand` belong to the
calling screen. Start with the maintained
[`ComponentsDemo`](../../packages/demos/src/ComponentsDemo.tsrx) for a complete
screen with these state/callback patterns.

Static matching trims and lowercases the query, checking labels and `keywords`.
`searchMode="substring"` is the default and preserves input order.
`searchMode="fuzzy"` additionally matches ordered subsequences: `prfrnc` finds
the keyword `preferences`. Exact, prefix, and substring matches precede
subsequences; tighter subsequences rank higher, with input order breaking ties.
This is a small command matcher, not typo correction or a linguistic search
engine. A missing static label displays the item's key.

`group` creates sections in first-occurrence order. Items keep their order within
each section; ungrouped items follow named sections. Grouping therefore takes
precedence over global ranking. Disabled entries stay visible but cannot be
highlighted or activated. `description` and `shortcut` add row text; shortcut
badges do not register key bindings.

## Source-backed results

Reuse the same `SearchSource` interface as Typeahead:

```ts
import type { CommandPaletteItem, SearchSource } from '@octane-xplat/ui'

const source: SearchSource<CommandPaletteItem> = {
	bootstrap: () => [{ id: 'settings', label: 'Settings', auxiliaryData: { group: 'Recent' } }],
	async search(query) {
		const response = await fetch(`/api/commands?q=${encodeURIComponent(query)}`)
		if (!response.ok) throw new Error('Command search failed')
		return await response.json()
	},
}
```

Pass `searchSource={source}` and `onValueChange={dispatchCommand}` to the palette.
The service response must satisfy `CommandPaletteItem[]` with unique `id` and
required `label`; use `auxiliaryData.group` for sections and optional `disabled`,
`icon`, `description`, or `shortcut` fields. Keep the source object stable.
`searchSource` takes precedence over `items` and owns matching/ranking; the
palette does not re-filter or re-score source results.

`bootstrap()` runs on open and when the trimmed query is empty. It can return
recent/frequent commands, but history collection, persistence, scope, and reset
remain caller-owned. Record selections in `onValueChange` if needed. The
component does not install a global Cmd/Ctrl+K opener or decide whether an ID is
an action or destination; the app owns both bindings and dispatch.

Each query immediately clears stale results and highlight and presents
`loadingText` (default “Loading…”). Both methods can return arrays or promises.
Optional `cancel()` is called on supersession, source replacement, close, and
unmount; generation checks also reject stale results when no cancel method exists.
A rejected/thrown search shows `errorText` with Retry. Retry reuses the current
query. `emptyBootstrapText` and `emptySearchText` distinguish an empty starting
set from no matches. Query changes are immediate; caching/debounce belongs to
the source if needed.

## Selection, rendering, and close

Desktop Enter activates the highlighted enabled result. Without a highlight it
executes nothing. Arrows clamp at the list boundaries; PageUp/PageDown jump to
first/last enabled results. Home/End retain normal text-caret behavior, Space
remains input, and IME composition does not activate commands. Hover highlights
without scrolling; web and macOS keyboard navigation scrolls the highlighted row into view.
Escape or Cancel closes. Web retains modal focus isolation, Tab containment, and
focus return through Overlay.

`value` is an optional controlled selected ID, separate from query text and
highlight. Without `value`, the palette retains its last selected ID for picker
use. `onValueChange(id)` runs before the close request, then a static/source
item's optional `onSelect()` runs. Do not dispatch the same action from both
callbacks. Closing resets the query/results and cancels in-flight work; selected
value is retained. External close and unmount also invalidate pending responses.

`renderItem(item, isSelected)` replaces inner row content while the palette keeps
selection and disabled handling. Use shared `Text`/`View` inside portable custom
content. `footer={false}` hides the footer; custom footer nodes work on all
leaves. Web defaults to keyboard hints; mobile has no default keyboard footer.
`width`, `maxHeight`, `style`, and `className` size/style the panel. `maxHeight`
bounds the result viewport, not the whole surface. Native software-keyboard
space still needs device verification for your chosen height/content.

## Platform boundaries and verification

| Target                 | Presentation and interaction                                                                                                                                  | Verification boundary                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Web / desktop webviews | Body-portal modal panel, named combobox/listbox, polite loading/result status, keyboard and pointer selection                                                 | Component and Chromium probes cover dispatched events; browser/AT and real OS input remain separate checks                |
| iOS / Android          | Existing bottom-sheet surface with keyboard lift, bounded scrollable results, visible Clear/Cancel, row names/disabled states and native status announcements | Search/Return submits the query; tapping a row activates it. No hardware-key highlight adapter is installed on mobile yet |
| Native macOS           | AppKit window-modal sheet, bounded results, live field search observer, window/editor-scoped navigation, tap selection and Cancel                             | Shared registry owns Escape and focus return. Physical keyboard/IME/VoiceOver remain separate from adapter dispatch       |

Native and web exports share `CommandPaletteProps`, `CommandPaletteItem`, and
`CommandPaletteMenuItem`. Platform-specific implementation remains behind file
suffixes; do not import DOM types or global APIs into shared source. Mobile
`ios`/`android` escape props reach the bottom-sheet host; `web` props reach the web
panel. AppKit escape bags remain unsupported by that experimental leaf.

Try the demo's static fuzzy palette and remote palette: query `preferences`,
query `fail` for its error/Retry path, select an enabled row, cancel, and reopen.
Test your own remote source with out-of-order responses and close during loading.
See the [implementation plan](../notes/command-palette-plan.md) for the follow-up work.

On macOS, the palette opens as a sheet attached to the calling window. Cancel,
selection, or Escape closes it and returns focus to the calling window. The
shared layer registry handles Escape, so a nested layer receives dismissal first.
PageDown reveals the last enabled result; PageUp returns to the first. Use
`maxHeight={120}` with a long grouped list to check scrolling in your app.

For a repeatable nonvisual macOS check, run the
[maintained host case](../../packages/ui/tests/command-palette-host.macos.tsrx)
with the command in the [implementation plan](../notes/command-palette-plan.md#remaining-work).
It checks modal attachment, native field focus, scrolling, text notifications,
dismissal, callback counts, and reopen without capturing images.
