# Select audit against Astryx’s selector family

Follow-up: [implementation plan](select-implementation-plan.md) and
[finite-list usage](../app/search-selection.md#choose-from-a-finite-list) document the
subsequent foundations. Findings below describe the audited baseline.

**Recommendation:** harden Select’s existing finite-list behavior first, give
MultiSelector a distinct typed contract, and keep async entity search, token
creation, custom selection surfaces, and structured filters in their existing
separate components. Expanding Select into all five Astryx roles would mix
incompatible value models and interaction states.

Audit date: 2026-10-02. Evidence: **desk-source**, plus inspection of existing
tests; no browser, device, AppKit, or assistive-technology runtime was run.
Octane-xplat baseline: `b42a00b7e73c21f7546941fe30fa276b75e3a54f`.
Astryx baseline: `06c8fa3165537dedbe67101cfcabbe14f0f82e82`.
Upstream files were fetched from `raw.githubusercontent.com/facebook/astryx/main/packages/core/src/...`
and their Git blob hashes checked against that pinned revision (80 files,
including supporting Layer, presentation-policy, and Tokenizer sources).
Links below pin upstream evidence so later changes on `main` cannot silently
change the comparison. This is an audit and proposal, not an implementation or
an adopted design decision.

## Current Octane-xplat boundary

The inspected [Select native leaf](../../packages/ui/src/Select.tsrx),
[web leaf](../../packages/ui/src/Select.web.tsrx), and
[macOS leaf](../../packages/ui/src/Select.macos.tsrx) already provide:

- Controlled or default selection and disclosure: `value`, `defaultValue`,
  `open`, `defaultOpen`, `onValueChange`, `onOpenChange`.
- `multiple`: toggles string values without closing; the trigger joins labels
  with commas. Single selection closes and reports a string.
- `searchable`: a separate popup TextInput with case-insensitive substring
  filtering of `label ?? value`. Closing through `setOpen(false)` resets the query.
- Disabled options, placeholder, optional clear (`null` for single; `[]` for
  multiple), inherited field states, and loading text. Loading does not block
  selecting available options.
- Anchored Popover composition on web/mobile. Web options have `role="option"`,
  `aria-selected`, `aria-disabled`, and Enter/Space activation; the list has
  `role="listbox"` and optional `aria-multiselectable`.

See [SelectOption/SelectProps](../../packages/ui/src/props.ts) and
`FieldControlProps` in the same file. The approximate 104-line description is
not a capability metric: these leaves have since grown, and some behavior is
owned by dependencies.

The public name `Selector` re-exports Select;
`MultiSelector` re-exports `SelectMenu`, whose implementation is merely
`<Select {...props} multiple={true} />`. `SelectorProps` and `MultiSelectorProps`
are both aliases of `SelectProps`. See [shared exports](../../packages/ui/src/index.shared.ts),
[web exports](../../packages/ui/src/index.shared.web.ts),
[macOS exports](../../packages/ui/src/index.macos.ts), and
[SelectMenu](../../packages/ui/src/aliases.web.tsrx).

```tsx
import { Selector, MultiSelector } from '@octane-xplat/ui'

export function Example() {
	const options = [{ value: 'sfo', label: 'San Francisco' }]
	return (
		<>
			<Selector options={options} defaultValue="sfo" />
			<MultiSelector options={options} defaultValue={['sfo']} />
		</>
	)
}
```

**Capabilities absent from Select are not necessarily absent from the library.**
`Typeahead`/`BaseTypeahead`, `Tokenizer`, `ComplexSelector`, and `PowerSearch`
already have separate exports and props. For example,
[BaseTypeahead.web.tsrx](../../packages/ui/src/BaseTypeahead.web.tsrx) and
[BaseTypeahead.tsrx](../../packages/ui/src/BaseTypeahead.tsrx) implement debounced
search/bootstrap, optional cancellation, stale-response generations, and
`auxiliaryData.group` grouping. [Tokenizer](../../packages/ui/src/Tokenizer.tsrx)
already supports `hasCreate`, removable tokens, and `maxEntries`.
Those source facts do not establish full Astryx parity or runtime verification.

```tsx
import { useState } from 'octane'
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'

export function Example() {
	const source = createStaticSource([
		{ id: 'sfo', label: 'San Francisco', auxiliaryData: { group: 'West' } },
	])
	const [items, setItems] = useState<import('@octane-xplat/ui').SearchableItem[]>([])
	return (
		<Tokenizer
			label="Regions"
			searchSource={source}
			value={items}
			onChange={setItems}
			hasCreate
			maxEntries={5}
		/>
	)
}
```

## Astryx contracts and why the family is split

The `.spec.md` files differ in scope and status. Selector records shipped
behavior; several others primarily record current anatomy. Read their source
and `.doc.mjs` together. In particular, PowerSearch’s spec describes **accepted,
implementation-pending** editor-width/anchoring changes; its 720px cap is not
counted here as a shipped gap. Selector’s spec also explicitly excludes the
unimplemented option-source proposal (`spec:AST-001`).

| Component       | Data and interaction contract                                                                                                                                                                                                               | Search, loading, and presentation                                                                                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selector        | One string value; clearable contract permits `null`. Normalizes strings, option objects, dividers, and sections. Supports `renderOption` and `renderValue`.                                                                                 | `hasSearch` filters supplied labels/values locally; empty/no-match states and announcements. `isLoading` exposes busy state and suppresses empty output. `changeAction` adds optimistic selection and pending state. Popover or modal bottom sheet; `adaptive` chooses by compact coarse-pointer policy. | [spec][selector-spec], [docs][selector-doc], [source][selector-source], [types][selector-types]                                                                                                                                                                                                                |
| MultiSelector   | Controlled `string[]`; toggles keep the surface open. Checkboxes and filtered enabled-item select-all with indeterminate state; selection-count announcements. `triggerDisplay` chooses count, labels, or badges.                           | Same local-search and grouped-option model; `changeAction` supports optimistic updates. Reuses Selector’s presentation controller and panel hosting. A badge summary is distinct from an editable token input.                                                                                           | [spec][multi-spec], [docs][multi-doc], [source][multi-source], [keyboard hook][multi-hooks]                                                                                                                                                                                                                    |
| ComplexSelector | Controlled generic `Value`; `children(value, onChange, close, state)` supplies custom content. Shell owns trigger, dialog, focus return, and optimistic `changeAction`; content owns its own grid/list/tree navigation and selection rules. | `state.isOpen/isBusy/triggerId/contentId`; input or ghost trigger; imperative `handleRef`. Uses shared Popover/Layer placement and alignment. No built-in option filtering, grouping, tokenization, or free-text rules.                                                                                  | [spec][complex-spec], [docs][complex-doc], [source][complex-source]                                                                                                                                                                                                                                            |
| Typeahead       | Controlled `SearchableItem                                                                                                                                                                                                                  | null`with`id`, `label`, optional `element`and`auxiliaryData`; selected Token enters edit mode on activation, with blur/Escape restoring the prior selection.                                                                                                                                             | `SearchSource.search/ bootstrap/ cancel?`, sync or async; debounce, minimum grapheme length, result limit, stale-response rejection, busy and completed-empty states. `renderItem` and grouped results. Editable input anchored to a result listbox. Free query text alone is not a committed arbitrary value. | [spec][typeahead-spec], [docs][typeahead-doc], [BaseTypeahead source][base-source], [types][typeahead-types] |
| PowerSearch     | Controlled filters with field/operator/typed value; `onChange(filters, changeType, index)`. Field suggestions, token removal/editing, and a separate operator/value editor.                                                                 | Composes Tokenizer and typed editors, including string/entity suggestion sources and enum/date/number/nested values. `resultCount` feedback. Main search menu and edit popover are separate layers with separate sizing policy.                                                                          | [spec][power-spec], [docs][power-doc], [source][power-source], [editor][power-editor]                                                                                                                                                                                                                          |

### Keyboard models are deliberately different

- **Selector:** arrows open/navigate enabled items; Home/End reach endpoints;
  Enter/Space open or commit; Escape dismisses and Tab exits the popup (search
  may first Tab to its clear button). Without search, printable
  typeahead on the closed trigger commits a match directly; repeated initials
  cycle, and open-menu typing highlights before Enter commits. With search,
  closed-trigger typing seeds the search input; Home/End retain caret behavior
  there and PageUp/PageDown reach option endpoints. Closed clearable triggers
  also support Delete/Backspace. See [hooks][selector-hooks] and [source][selector-source].
- **MultiSelector:** arrows/endpoints navigate, Enter/Space toggle without
  closing, Escape/Tab close. Non-search prefix matching opens/highlights rather
  than committing a single value (500ms buffer in `useMultiCombobox`). Search
  preserves Space typing; the search input routes navigation keys. See
  [hooks][multi-hooks] and [source][multi-source]. Do not assume it has exactly
  Selector’s repeated-initial matching algorithm.
- **Typeahead:** focus stays on the editable combobox with
  `aria-activedescendant`; arrows wrap through results, Home/End reach first/last,
  Enter commits the highlighted item, Escape/Tab dismiss. IME events are guarded.
  See [BaseTypeahead][base-source].
- **ComplexSelector:** button activation and ArrowDown open the dialog;
  shell handles dismissal/focus return, while supplied content defines its
  navigation. **PowerSearch:** suggestions use the Tokenizer/BaseTypeahead path;
  editor Enter saves and Escape cancels unless a child handled the event or
  composition is active. See [ComplexSelector][complex-source] and
  [PowerSearchEditPopover][power-editor].

Free-text creation belongs to Astryx’s [Tokenizer][tokenizer-source]
(`hasCreate`, a query-derived Create entry, removable tokens, Backspace removal),
which PowerSearch composes. It is not a missing shipped free-text mode of Selector
or Typeahead. PowerSearch also accepts free strings within configured value
editors; these become typed filters, not arbitrary Select option keys.

```tsx
// Xplat usage of the same token-creation role; not an Astryx import.
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import { useState } from 'octane'

const source = createStaticSource([])
export function Tags() {
	const [tags, setTags] = useState<SearchableItem[]>([])
	return <Tokenizer label="Tags" searchSource={source} value={tags} onChange={setTags} hasCreate />
}
```

## Prioritized gaps

P0 = correctness/accessibility of the current control; P1 = useful cross-platform
finite-list capability; P2 = specialized presentation or sibling-component work.
These are recommended priorities, not release commitments.

| Priority / gap                            | What Select lacks or only partly covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Mobile relevance and owner                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0: coherent navigation and semantics** | No highlighted option, arrow/Home/End/Page navigation, printable typeahead, search-key routing, auto-focus on open, focus return, or Tab-close path. Web uses a generic Pressable button-role trigger without `aria-expanded`, `aria-haspopup`, `aria-controls`, or active-descendant linkage; every enabled option is a separate tab stop. Escape is a global listener, without nested-layer precedence or an IME guard at Select’s level. Native rows expose no explicit option role/selected accessibility state. | Essential on desktop; hardware keyboards and screen readers make it relevant on mobile too. Define shared selection/highlight rules, with web ARIA and native accessibility/focus adapters. Reuse established typeahead logic where appropriate rather than copying browser APIs into shared code.                                          |
| **P0: state transitions**                 | `isReadOnly` blocks pick/clear/open activation, but retains the caret and does not close an already-open popup. `open=true` or `defaultOpen=true` can expose the surface while disabled/read-only. No guard reconciles later policy changes. `disabledMessage` reaches an accessibility hint through field context, but the web disabled trigger has `tabIndex=-1` and no reason tooltip.                                                                                                                            | Real on all platforms. Disabled/read-only policy must govern surface availability and every mutation path. Focusable-disabled explanation and HTML submission details need web-specific handling.                                                                                                                                           |
| **P0: macOS hosting**                     | `Select.macos.tsrx` passes anchor, placement, and dismissal to [Popover.macos.tsrx](../../packages/ui/src/Popover.macos.tsrx), which only conditionally renders an inline flexbox and ignores those props. It does not implement the anchored/dismissible contract implied by Select’s comment.                                                                                                                                                                                                                      | AppKit-specific gap, not mobile or browser behavior. Resolve overlay hosting before promising an AppKit Select v2. macOS WebView consumers using web leaves are a separate case.                                                                                                                                                            |
| **P1: search feedback**                   | Local filtering already matches Astryx’s case-insensitive substring predicate. Missing custom search placeholder, search-clear action, empty-list/no-match messages, filtered result announcements, and keyboard navigation tied to the visible filtered set. No public query callback or source lifecycle.                                                                                                                                                                                                          | Filtering and understandable empty/loading feedback are real touch needs. Async search belongs to existing Typeahead, rather than extending `searchable` into a remote data contract. Neither current Astryx Selector nor ours provides a general public custom filter predicate.                                                           |
| **P1: usable multi-selection**            | Toggle persistence and `string[]` already exist. Missing `hasSelectAll`, filtered enabled-item scope/indeterminate state, selection announcements, `triggerDisplay`, `formatValue`, and capped badges (`maxBadges`). Uses the single check indicator on web/mobile; macOS hardcodes a check glyph. No typed multi-only contract.                                                                                                                                                                                     | Real on mobile: selecting many filters and understanding/removing selections are not desktop-only needs. Own finite-list bulk selection in MultiSelector; own editable/searchable chips in Tokenizer.                                                                                                                                       |
| **P1: richer option data**                | `SelectOption` only has `value`, `label`, `isDisabled`; no sections/dividers, descriptions/icons, `renderOption`, or `renderValue`. Filtering, navigation, and group rendering need one normalized option order.                                                                                                                                                                                                                                                                                                     | Useful everywhere for countries, accounts, people, and settings. Keep custom rendering portable; native ReactNode/DOM content cannot be copied literally.                                                                                                                                                                                   |
| **P1: touch presentation**                | Always composes Popover; no `presentation`, adaptive sheet, sheet title, sheet focus transfer, or selector-owned scroll viewport. Existing list containers render every row; Select does not supply a ScrollView.                                                                                                                                                                                                                                                                                                    | Direct mobile gap, including mobile web. Astryx uses `(max-width: 768px) and (pointer: coarse)`; native needs an equivalent target-aware policy, not a CSS query in shared code. Add bounded scrollable content before supporting long lists. Virtualization is a separate scalability decision, not an inferred shipped Astryx capability. |
| **P1: async commit semantics**            | `isLoading` is caller-controlled display state; no `changeAction`, optimistic controlled value, pending lifecycle, or action-error policy. Loading text appears in trigger and panel; available options remain selectable.                                                                                                                                                                                                                                                                                           | Real mobile/network workflow need. Add a bounded commit contract if needed for Select/MultiSelector; keep search cancellation/debounce in Typeahead. Astryx pending selection actions and async search are separate concerns.                                                                                                               |
| **P2: field/trigger composition**         | Inherited `size`, `status`, label/description and required/optional flags partly resolve via `useFieldControlProps`; Select itself does not render standalone Field chrome, apply field `width`, honor `statusVariant` layout, or add `startIcon`/`variant`.                                                                                                                                                                                                                                                         | Portable form usability gap; external Field composition can cover some presentation today. Decide explicitly whether v2 owns its standalone shell and omits it inside InputGroup, as Astryx does.                                                                                                                                           |
| **P2: advanced sibling roles**            | Select cannot represent a generic render-function dialog, async entity item/token, free-text token creation, or field/operator/value filter. Existing ComplexSelector, Typeahead, Tokenizer, and PowerSearch already cover parts of those roles.                                                                                                                                                                                                                                                                     | All can serve mobile products, though a dense faceted editor needs touch layout. Improve those siblings separately; their existence is not proof of keyboard, focus, read-only, or async parity.                                                                                                                                            |

### Overlay parity: existing capability versus missing policy

[Popover.web.tsrx](../../packages/ui/src/Popover.web.tsrx) already portals to
`document.body`, measures the anchor and panel, uses `positionPopover` for
placement/collision handling, and updates on resize/scroll. Mobile
[Popover.tsrx](../../packages/ui/src/Popover.tsrx) creates a separate root in the
anchor page’s RootLayout and tracks layout/scroll. Both provide outside-tap
backdrops. Therefore “Select has no portal or anchoring” would be incorrect for
these targets.

```tsx
import { Screen, View, Pressable, Popover, Text } from '@octane-xplat/ui'
import { useState, useRef } from 'octane'

export function Example() {
	const anchor = useRef(null)
	const [open, setOpen] = useState(false)
	return (
		<Screen>
			<View
				ref={(view) => {
					anchor.current = view
				}}
			>
				<Pressable onPress={() => setOpen(true)}>
					<Text>Open</Text>
				</Pressable>
			</View>
			<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)}>
				<Text>Anchored content</Text>
			</Popover>
		</Screen>
	)
}
```

Astryx’s [Layer/useLayer.tsx][layer-source] uses CSS anchor positioning and the
browser Popover API/top layer, retaining inline hosting when suitable and
choosing a portal when needed. Selector adds selected-row-over-trigger alignment
when neither search nor explicit placement is supplied; search/explicit placement
uses ordinary Layer positioning. Our default is always `bottom` with an 8-unit
Popover offset. Browser top-layer hosting, writing-context preservation, and
selected-row overlay alignment are primarily desktop/web details; collision
handling, nested dismissal, scroll visibility, focus return, and touch sheet
hosting are cross-platform needs. A fixed z-index body portal is not equivalent
to browser top-layer hosting. This audit does not claim runtime geometry or
nested dismissal success on either side.

## Overlapping API mismatches

| Concept               | Octane-xplat                                                                            | Astryx                                                                                                | Consequence                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Value/change          | Optional `value/defaultValue: string                                                    | string[]                                                                                              | null`; `onValueChange`has the same union regardless of`multiple`                                                                                | Selector discriminates clearable/non-clearable string callbacks; MultiSelector requires `value: string[]` and `onChange` | Current aliases allow wrong shapes and require consumer narrowing. Runtime can render multiple labels even in single mode if an array is supplied. Prefer separate contracts, or a discriminated internal union. |
| Option disabled state | `isDisabled`                                                                            | `disabled` on option data; `isDisabled` on the field                                                  | Directly reusing Astryx option objects will not disable our rows. Adapt data deliberately.                                                      |
| Search                | `searchable`                                                                            | `hasSearch`, `searchPlaceholder`, `emptyText`, `emptySearchText`                                      | Same basic filter, different prop names and feedback contract. Existing aliases do not translate these names.                                   |
| Initial/open state    | `defaultOpen`, controlled `open`, `onOpenChange`                                        | Selector/MultiSelector source exposes `isDefaultOpen`; owns visibility through presentation machinery | Our controlled-open feature is additional surface, not a missing Astryx prop. It needs defined focus and blocked-state behavior.                |
| Placement             | `top/bottom/left/right`, default `bottom`                                               | Layer `above/below/start/end`; Selector placement omission enables selected-item alignment            | Names and physical/logical direction differ; replacing `below` with `bottom` also loses the omission policy.                                    |
| Clear                 | `hasClear`, plus `onClear`; reports `null` or `[]`                                      | `hasClear`; change callback receives cleared value                                                    | Behavior overlaps, but nullable typing and callback names differ. Our clear also closes; document that policy.                                  |
| Read-only/disabled    | Shared names inherited via `FieldControlProps`                                          | Same field names with focus, disclosure-removal, and form guarantees                                  | Prop-name equality does not imply equivalent behavior; see P0.                                                                                  |
| Loading               | Inherited `isLoading`, literal Loading text, web busy/status attributes                 | Busy state plus component-specific loading/empty behavior; `changeAction` for commits                 | Do not equate external loading with managed async lifecycle, or assume loading disables all selection.                                          |
| Field integration     | Optional `label`; inherited `width/statusVariant` are not applied by Select’s own shell | Required label and standalone Field; InputGroup can own the shell                                     | Existing Field context associations are useful, but standalone Select is not an equivalent self-contained labeled field.                        |
| Form submission       | No Select `htmlName` or hidden inputs                                                   | `htmlName`; one hidden input per MultiSelector value                                                  | Web form gap. Native needs application state integration, not hidden HTML. Tokenizer’s existing `htmlName` does not solve Select submission.    |
| Styling/content       | `className/style`, fixed label/check/caret; global indicator override on web/mobile     | `xstyle`, input/ghost variant, slots/renderers, indicator placement                                   | StyleX itself need not be mirrored; expose equivalent semantic choices through xplat conventions. macOS currently bypasses indicator overrides. |

The sibling API split is already plausible: Typeahead uses `SearchSource<T>` and
`T | null`; Tokenizer uses `T[]` and structured change details; ComplexSelector
uses generic `Value`; PowerSearch uses typed filters. ComplexSelector adapts
Astryx’s `handleRef` to `bind`, and PowerSearch adapts the ref to a callback.
Treat those as explicit portability choices, not interchangeable signatures.

```tsx
import { useState } from 'octane'
import { Typeahead, Tokenizer, ComplexSelector, createStaticSource, Text } from '@octane-xplat/ui'

export function Example() {
	const source = createStaticSource([{ id: '42', label: 'Alec' }])
	const [person, setPerson] = useState<import('@octane-xplat/ui').SearchableItem | null>(null)
	const [people, setPeople] = useState<import('@octane-xplat/ui').SearchableItem[]>([])
	return (
		<>
			<Typeahead label="Person" searchSource={source} value={person} onChange={setPerson} />
			<Tokenizer label="People" searchSource={source} value={people} onChange={setPeople} />
			<ComplexSelector label="Color" value="blue">
				{(value) => <Text>{value}</Text>}
			</ComplexSelector>
		</>
	)
}
```

## Recommended phases and acceptance evidence

1. **Select v2 foundations (P0).** Define opening/closing, highlight, focus,
   disabled/read-only transitions, and dismissal precedence. Implement adapters
   at platform file boundaries; correct AppKit hosting. Preserve current
   selection/filtering unless a migration explicitly changes them. Acceptance:
   real keyboard open/navigate/commit/Tab/Escape, disabled-option skipping,
   screen-reader relationships/selected state, focus return, blocked-state
   transitions, and anchored/outside-dismiss behavior on each supported target.
2. **Finite-list parity (P1).** Share option normalization, grouped filtering,
   announcements, bounded scrolling, empty/loading display, and adaptive
   presentation. Give `Selector` and `MultiSelector` distinct public types while
   reusing a shared engine. MultiSelector owns select-all/count/labels/badges;
   Selector owns one-value rendering. Add async commit behavior only with an
   explicit rejection/concurrency policy. Acceptance: filtered group order and
   keyboard order agree; bulk selection preserves hidden/disabled selections;
   pending actions and sheet dismissal maintain correct value/focus.
3. **Use and harden existing search/token siblings.** Keep remote lookup,
   debounce/minimum query/cancellation in Typeahead and free-text creation/removal
   in Tokenizer. Test stale responses, source replacement, IME, edit cancellation,
   token caps/removal, and soft-keyboard/sheet geometry on mobile. Select’s local
   popup filter should remain a simpler mode, not a second async search engine.
4. **Specialized shells and filters (P2).** Keep ComplexSelector and PowerSearch
   separate. Audit their own dialog/keyboard/error contracts before claiming
   parity. For example, current [ComplexSelector.web.tsrx](../../packages/ui/src/ComplexSelector.web.tsrx)
   restores focus but has no Escape/ArrowDown handler, and its imperative `open`
   does not guard disabled state. Current [PowerSearch.web.tsrx](../../packages/ui/src/PowerSearch.web.tsrx)
   renders suggestion Pressables rather than the Astryx Tokenizer navigation
   path; its clear-all button is disabled only by `isDisabled`, so `isReadOnly`
   does not block that mutation. These warrant separate correctness work, not
   new props on Select. Evaluate Astryx’s pending editor sizing proposal later.

**Recommended split:** mirror the semantic roles, not five independent copies
or every upstream prop. Retain the existing names; evolve the MultiSelector alias
into a meaningful facade and share DOM-free selection/search primitives where
contracts actually match. One large Select with booleans for multiple, remote,
creatable, custom-dialog, and structured-filter modes would make valid values,
callbacks, keyboard ownership, and error handling harder to express and test.

[packages/picker](../../packages/picker/README.md) remains the intentional
platform-authentic escape: SwiftUIPicker on iOS, MaterialDropdown on Android,
and HTML Select on web, via platform subpaths with distinct contracts.
[packages/date-picker](../../packages/date-picker/README.md) provides SwiftUI,
Material, and AppKit date/time widgets; it is not an entity-search or multi-select
solution. Neither leaf removes the need for shared searchable/multi-selection
UX, and plugin-backed functionality must stay outside dependency-free UI additions.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Region.ios.tsrx: platform-authentic picker, distinct from shared Selector.
import { SwiftUIPicker } from '@octane-xplat/picker/ios'

export function Region() {
	return (
		<SwiftUIPicker
			label="Region"
			options={[{ id: 'sfo', title: 'San Francisco' }]}
			defaultSelection="sfo"
		/>
	)
}
```

## Demo, test, and verification coverage

[ComponentsDemo.tsrx](../../packages/demos/src/ComponentsDemo.tsrx) exercises the
`Selector` alias with three fruit options, a disabled cherry, controlled value,
and `searchable`. It also demonstrates a separate Typeahead and creatable
Tokenizer. [PowerSearchDemo.tsrx](../../packages/demos/src/PowerSearchDemo.tsrx)
demonstrates structured filtering. NativePickerDemo’s platform leaves exercise
`packages/picker`, not the shared Select contract.

The located direct Select tests are two cases in
[SearchInput.web.test.tsrx](../../packages/ui/src/SearchInput.web.test.tsrx): clear
without opening, and busy state while an available option can still be selected.
No dedicated Select native/macOS or multi-select/navigation/filtering/readonly
transition coverage was located in the searched maintained tests/probes.
[typeahead-source.test.ts](../../packages/ui/src/typeahead-source.test.ts) tests
static keyword matching, grapheme counts, and grouping;
[power-search-config.test.ts](../../packages/ui/src/power-search-config.test.ts)
tests config/filter helpers. These do not establish component interaction parity.
Astryx has component tests plus Selector/MultiSelector listbox accessibility
suites and Selector Chromium accessibility fixtures; source inspection of those
assets is evidence of coverage intent, not a claim that their tests passed here.

Attempted focused check:

```sh
pnpm --filter @xplat/web exec vitest run --config vitest.config.mts packages/ui/src/SearchInput.web.test.tsrx packages/ui/src/typeahead-source.test.ts packages/ui/src/power-search-config.test.ts
```

It could not run: `Command "vitest" not found` in this workspace’s pnpm environment.
No dependencies were installed for this audit. `pnpm exec oxfmt --check docs/notes/astryx-parity-select.md`
also could not run because `oxfmt` was not found. Local Markdown link/reference
checks and Git whitespace checks passed. Runtime targets run: **none**.
No screenshots or other visual analysis were used. Component code, dependencies,
and CHANGELOG were not changed. No recipe is affected: this document records
findings/proposals and changes no public behavior, setup, or supported workflow.
Future implementation must reconcile affected recipes, docs, and examples and
record verification separately from coverage.

[selector-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/Selector.spec.md
[selector-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/Selector.doc.mjs
[selector-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/Selector.tsx
[selector-types]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/types.ts
[selector-hooks]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/hooks.ts
[multi-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/MultiSelector/MultiSelector.spec.md
[multi-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/MultiSelector/MultiSelector.doc.mjs
[multi-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/MultiSelector/MultiSelector.tsx
[multi-hooks]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/MultiSelector/hooks.ts
[complex-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/ComplexSelector/ComplexSelector.spec.md
[complex-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/ComplexSelector/ComplexSelector.doc.mjs
[complex-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/ComplexSelector/ComplexSelector.tsx
[typeahead-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/Typeahead.spec.md
[typeahead-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/Typeahead.doc.mjs
[base-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/BaseTypeahead.tsx
[typeahead-types]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/types.ts
[power-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/PowerSearch/PowerSearch.spec.md
[power-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/PowerSearch/PowerSearch.doc.mjs
[power-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/PowerSearch/PowerSearch.tsx
[power-editor]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/PowerSearch/PowerSearchEditPopover.tsx
[layer-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Layer/useLayer.tsx
[tokenizer-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Tokenizer/Tokenizer.tsx
