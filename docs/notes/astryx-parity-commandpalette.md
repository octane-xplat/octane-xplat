# CommandPalette: Astryx parity audit

> Prioritize the search and interaction contracts needed for a useful desktop
> command palette and a touch-first mobile search sheet.

**Recommendation:** repair keyboard/accessibility and macOS contract gaps first,
then connect the existing shared `SearchSource` API, grouping, and result states.
Treat fuzzy ranking and usage history as optional source policies. On iOS/Android,
share the search/selection model but use a search-sheet presentation rather than
copying desktop placement and keyboard hints.

## Scope and evidence

Audit date: **2026-10-02**. Xplat source revision:
`b42a00b7e73c21f7546941fe30fa276b75e3a54f`. Astryx revision:
[`06c8fa3165537dedbe67101cfcabbe14f0f82e82`](https://github.com/facebook/astryx/commit/06c8fa3165537dedbe67101cfcabbe14f0f82e82).
Upstream files were fetched from `raw.githubusercontent.com` at that revision.
The current `packages/core/src/CommandPalette` directory has **25 files**, not
17: eight runtime files (root, context, six parts), eight test files, seven
`.doc.mjs` files, one draft specification, and `index.ts`.

Evidence is **desk-source**: local leaves, shared props, demo, parity fixture and
checks, upstream runtime code, documentation metadata, and test assertions were
inspected. No component tests, target apps, OS input, assistive technology,
or visual comparisons were run for this audit; no successful build was obtained. Upstream tests cited below are
coverage evidence from reading assertions, not newly verified passes.

This is an audit and proposed roadmap. It changes no runtime behavior or public
workflow, creates no implementation decision, and does not claim parity from
file counts. No recipe changes are required; implementation phases below will
need their own recipe/documentation reconciliation.

## Current Xplat contract

[`CommandPaletteProps`](../../packages/ui/src/props.ts) accepts `items: MenuItem[]`,
optional `open`, `onOpenChange`, `placeholder`, `className`, `style`, `id`, and
`ios`/`android`/`web` escape props. `MenuItem` contains `key`, optional `label`,
`icon`, `disabled`, and `onSelect(): void`.

All three leaves implement case-insensitive **substring filtering** of
`label ?? key`, preserving input order. They do not trim the query. Empty input
shows every supplied item. Clicking/tapping an enabled item calls
`onOpenChange(false)` before `item.onSelect()`. Internally requested close clears
the query; there is no explicit query reset on a caller's `open=false` change.
There is no internal open-state fallback when `onOpenChange` is omitted.

| Target / file                                                             | Behavior established by source                                                                                                                   | Important boundary                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Native default](../../packages/ui/src/CommandPalette.tsrx) (iOS/Android) | RootLayout `Overlay`, shade dismissal, text input, tap rows, submit first result if enabled; panel `marginTop={80}` and screen-derived max width | Plain flex layouts, no result scroll container, highlight state, or palette hardware-key handler                                                                                                                                                               |
| [Web](../../packages/ui/src/CommandPalette.web.tsrx)                      | Body-portal overlay, Escape listener, listbox/options, click rows, submit first result if enabled                                                | `Overlay.web.tsrx` delegates modal focus isolation, initial focus, Tab containment and focus return to `modal-focus.web.ts`; these are existing capabilities                                                                                                   |
| [macOS](../../packages/ui/src/CommandPalette.macos.tsrx)                  | Filtered label/icon rows and tap selection; top offset 80                                                                                        | Imported `surfaces.macos.tsrx` `Overlay` only conditionally renders a flex layout: it ignores `shadeCover`/`onDismiss`. Imported `text-controls.macos.tsrx` `TextInput` ignores `onSubmit`. Shade/Enter promises are therefore unsupported by this composition |

The shared props comment promises Enter selects a **highlighted** match; the
leaves have no highlight model and request `shown[0]` instead. A disabled first
match blocks submit even when later enabled matches exist. Missing `label` can
match through `key` but produces no visible label. Declared palette escape props
are not forwarded to its input, panel, or overlay in any of these leaves.

## Astryx's actual contract

The references below are pinned raw source links. `A1`–`A10` identify files used
throughout this report; names refer to `packages/core/src/` in Astryx.

| Ref | File / responsibility                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | [CommandPalette/CommandPalette.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPalette.tsx): root props, `runSearch`, `handleClose`, `buildSelectableItems`, `ItemRenderer`                                                                                                                                                     |
| A2  | [Typeahead/types.ts](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/types.ts): `SearchableItem`, `SearchSource`                                                                                                                                                                                                                                 |
| A3  | [Typeahead/createStaticSource.ts](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Typeahead/createStaticSource.ts): static filtering and `keywords`                                                                                                                                                                                                        |
| A4  | [Selector/hooks.ts](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Selector/hooks.ts): `useCombobox`                                                                                                                                                                                                                                                      |
| A5  | [CommandPalette/CommandPaletteInput.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteInput.tsx): query input, autofocus, ARIA, delayed spinner, `endContent`                                                                                                                                                              |
| A6  | [CommandPalette/CommandPaletteItem.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteItem.tsx): value, selection, disabled state, arbitrary row content                                                                                                                                                                    |
| A7  | [CommandPalette/CommandPaletteGroup.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteGroup.tsx) and [CommandPaletteList.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteList.tsx): labeled groups and scrollable listbox   |
| A8  | [CommandPalette/CommandPaletteEmpty.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteEmpty.tsx) and [CommandPaletteFooter.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteFooter.tsx): empty content and keyboard guidance |
| A9  | [CommandPalette/CommandPalette.test.tsx](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPalette.test.tsx): root, search, slots, announcements, close-race and hover assertions                                                                                                                                                      |
| A10 | [CommandPalette/CommandPaletteContext.ts](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPaletteContext.ts) and [index.ts](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/index.ts): context and exported parts                                        |

### Matching, ranking, sections, and history

Astryx delegates matching to `searchSource.search(query)` and empty-query results
to `bootstrap()` (A1–A3). Its static helper trims/lowercases queries and matches
label or caller-extracted `keywords`, preserving array order. **There is no
built-in fuzzy algorithm, score field, score sorting, or match-range highlighting.**
A custom source can return fuzzy/ranked/server results; the root renders them.
During async work, previous committed results are optimistically narrowed by
trimmed label substring, which can temporarily hide alias/fuzzy-only matches.

`auxiliaryData.group: string` creates labeled sections. Groups appear in first
occurrence order, items retain order within groups, and ungrouped items follow
all named groups. `buildSelectableItems` and `ItemRenderer` use the same grouped
order (A1, A7). Thus grouping can change a source's global ranking order; there
is no separate section-priority or score-merging API.

**Recent/frequent results are an extension point, not a built-in history feature.**
`bootstrap()` can supply them and `onValueChange(id)` can let a caller record
selection. The audited root/helper has no recency store, usage counter,
persistence, decay policy, or history-clearing API (A1–A3).

### Async results, loading, and empty states

`SearchSource<T>` accepts synchronous arrays or promises from both `search` and
`bootstrap`, plus optional `cancel()` (A2). A1 bootstraps on open/empty query,
cancels superseded work, uses a request version to discard stale responses, and
invalidates work on internal close. Query input updates optimistically while
committed query/results advance together. `isBusy` drives the input spinner,
whose visual appearance is delayed 150 ms (A5). Polite announcements cover
loading, result count, and no results; bootstrap stays silent (A1, A9).

`emptyBootstrapText` and `emptySearchText` provide different arbitrary content for
empty initial results and failed searches; their choice uses committed search
state, and the empty content remains mounted during pending work (A1, A8, A9).
There is no root debounce option or explicit error/retry slot. `runSearch` has no
local rejection handler. Close cleanup is in `handleClose`; an externally driven
`isOpen=false` does not itself call that function. These are upstream limitations
to resolve deliberately, not behaviors to assume safe or reproduce blindly.

### Keyboard, pointer, accessibility, and selection

A1 delegates highlight state to A4 and attaches keyboard handling through A5:

- ArrowDown/ArrowUp move through selectable indices and clamp at the boundaries;
  there is no wrap. With no highlight, either arrow reaches the first enabled
  index under the current hook logic.
- Home/End and PageUp/PageDown move to the first/last enabled index. The palette
  does not pass `hasSearch=true`, so the hook claims Home/End even in its input.
- Enter selects the highlighted ID and closes; with no highlight it selects
  nothing. Space remains text input. Typing alone does not move the highlight.
- Escape requests close. Tab clears highlight through the hook, but its close
  callback is a no-op in this palette; Tab alone does not request palette close.
- Delegated list mouseover highlights without scrolling; keyboard highlight
  scrolls into view through the shared highlight-scroll hook.

A5 supplies a named combobox with `aria-expanded`, `aria-autocomplete`,
`aria-controls`, and `aria-activedescendant`. A7 supplies a named listbox and
`role="group"` headings. A6 separates keyboard highlight from selected-value
`aria-selected`. A1 supplies a named delegated `Dialog`; A5 autofocuses except
for inline previews. `value`/`onValueChange` support picker mode, independent of
query text. Both keyboard activation and default item click update value and
close. Neither root installs a global Cmd/Ctrl+K opening shortcut (A1, A10).

**Disabled-item caveat:** standalone `CommandPaletteItem.isDisabled` blocks click,
and `useCombobox` can skip `disabled` entries, but A1's root-created selectable
items carry only `value` and `label`; its default renderer does not propagate
item disabled data. `renderItem` customizes inner content, not the wrapper.
Do not infer fully disabled-aware root navigation from the subcomponent prop.
Also, bootstrap preselection looks up an index in raw results although keyboard
indices use grouped order; interleaved groups can misalign that initial highlight
(A1, A4, A6). Root keyboard handling has no explicit IME-composition guard.

### Actions, navigation, rendering, and shortcuts

There is **no discriminated action/navigation item type or built-in `href`** in
Astryx's palette data. Root activation emits an ID through `onValueChange`; the
caller maps that ID to an action or route. The standalone item has
`onSelect(value)` and arbitrary `children`. The root's `renderItem(item,
isSelected)` supports icons, descriptions, and shortcut badges while preserving
groups (A1, A6). `SearchableItem.element` is declared by A2 but A1's palette
renderer does not consult it; this Typeahead capability does not automatically
apply to CommandPalette.

The default footer shows up/down, Enter, and Escape `Kbd` hints. `footer`, footer
`children`, `input`, and input `endContent` customize guidance and trailing
controls (A5, A8). Shortcut badges are presentation; there is no per-command
shortcut registry or dispatcher in these files. Nullish slot fallback means
`footer={null}` restores the default rather than hiding it (A1).

## Prioritized gaps

P0 means a broken advertised/basic interaction; P1 means a missing core search
or usability contract; P2 means customization or optional product policy. Mobile
importance below is a recommendation, not upstream native behavior evidence.

| Priority | Gap in Xplat                                                                                                     | Astryx reference / precise parity boundary                                                                                     | Mobile importance                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| P0       | No highlight model, arrow navigation, hover highlight, or highlighted Enter; disabled first result blocks submit | A1/A4/A6: explicit highlight distinct from selected value; root disabled propagation remains an upstream caveat                | Secondary for touch, essential with hardware keyboard and for deterministic submit policy    |
| P0       | macOS shade dismissal and Enter bindings are not consumed by wrappers                                            | Local `surfaces.macos.tsrx` and `text-controls.macos.tsrx`; A1 uses a dialog and input event wiring                            | Desktop-specific, but must prevent claiming identical behavior from identical props          |
| P0       | Palette-specific accessible names and input/result relationship are missing                                      | Web has dialog isolation already; missing A5/A7 combobox linkage, option IDs/selected state, labels, and A1 live announcements | High: native semantic roles, disabled state, focus and announcements need native equivalents |
| P1       | Only `MenuItem[]`; no source hook, async bootstrap, cancellation, stale protection, or loading state             | A1/A2 `searchSource`, `isBusy`; error handling is a recommended addition beyond audited upstream                               | High for remote/global app search                                                            |
| P1       | No sections; labels/icons are the only row content                                                               | A1 `auxiliaryData.group`, A7 headings; A1 `renderItem`                                                                         | High for mixed destinations/actions and result disambiguation                                |
| P1       | Zero results render a blank list; no initial-search guidance                                                     | A1 `emptyBootstrapText` / `emptySearchText`, A8 empty part                                                                     | High; distinguish loading, empty, error, and no matches                                      |
| P1       | No bounded scrollable result region or keyboard visibility management                                            | A7 scrollable list, A1 `maxHeight`, A4 highlight scroll; Xplat uses plain flex result layouts                                  | High: results must remain reachable above the soft keyboard                                  |
| P1       | No explicit cleanup for externally controlled close; optional callback can leave controlled palette open         | A1 has required callback and internal-close cleanup, but also lacks external-close cleanup                                     | High; close/unmount must invalidate remote work and define query/value retention             |
| P2       | No selected `value`/`onValueChange` picker mode or generic item metadata                                         | A1/A2, distinct from Xplat per-item action callbacks                                                                           | Medium; useful for a searchable picker, not required for command execution                   |
| P2       | No input/footer slots, descriptions, trailing actions, or shortcut hints                                         | A5/A6/A8; no built-in shortcut execution upstream                                                                              | Descriptions/clear/close controls high; desktop key hints low                                |
| P2       | No keyword aliases, normalized query, fuzzy scoring, or ranking adapter                                          | A3 has keywords/trim; fuzzy/scoring require custom A2 source on both sides                                                     | Aliases high; fuzzy ranking product-dependent                                                |
| P2       | No recent/frequent bootstrap policy or selection-history hook                                                    | A2 bootstrap and A1 value callback enable caller policy; no built-in history on either side                                    | Medium/high for repeated navigation; persistence is caller-owned                             |

## API mismatches and reuse

| Concern            | Xplat                                                     | Astryx                                                                                                           | Consequence / proposed direction                                                                                       |
| ------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Visibility         | `open?`, `onOpenChange?`                                  | required `isOpen`, `onOpenChange`                                                                                | Naming differs; optional props do not create uncontrolled behavior. Choose compatibility explicitly before a migration |
| Data               | required `items: MenuItem[]` with `key`, optional `label` | required `searchSource: SearchSource<T>` with `id`, required `label`, `auxiliaryData`                            | Adapt static menu data or migrate callsites; do not introduce a second incompatible source contract                    |
| Activation         | `item.onSelect()` after close request                     | `onValueChange(id)` before close request; standalone item `onSelect(value)`                                      | Define action dispatch, callback order, and selected-value ownership separately                                        |
| Query / input      | root `placeholder`; private query                         | `input` slot; `CommandPaletteInput.value`, `onValueChange`, `placeholder`, `label`, `hasAutoFocus`, `endContent` | Root `value` means selection, not query; custom input must retain search/keyboard wiring                               |
| Rendering / groups | optional string `icon`; no metadata/slots                 | `renderItem(item, isSelected)`, `auxiliaryData.group`; six exported parts and context hook                       | Render callback describes inner content, not replacement navigation semantics                                          |
| Result states      | none                                                      | `emptySearchText`, `emptyBootstrapText`; internal `isBusy`                                                       | Define additional errors/retry without claiming Astryx parity requires them                                            |
| Surface            | arbitrary `style`; fixed/default panel sizing             | `label`, `width=640`, `maxHeight=480`, `ref`, `isInline` preview mode                                            | Preserve shared types; expose native handles through project conventions, not DOM refs                                 |
| Escapes / style    | `className`, `style`, declared unused platform escapes    | `BaseProps<HTMLDialogElement>` plus StyleX/DOM props                                                             | Do not copy DOM/React/StyleX types into shared props; implement or remove misleading escape promises                   |

Xplat already has `SearchableItem`, `SearchSource`, and
`CreateStaticSourceOptions` in [`props.ts`](../../packages/ui/src/props.ts), plus
[`createStaticSource` and `groupTypeaheadItems`](../../packages/ui/src/typeahead-source.ts).
They match the relevant source shape and grouping order (default ungrouped-last).
[`typeahead-source.test.ts`](../../packages/ui/src/typeahead-source.test.ts) asserts
trimmed keyword/label matching and stable grouping, but CommandPalette currently
uses none of them. This reuse reduces API/dependency cost; it does not establish
palette lifecycle or keyboard correctness. `packages/ui` must gain no new
dependencies or peers; shared search helpers should remain DOM-free and platform
input/surface differences should stay at file boundaries.

Neither side defines first-class action versus navigation semantics. Today,
Xplat callers can navigate inside `onSelect`; Astryx callers can dispatch on ID.
If a typed `kind: 'action' | 'navigation'` or `href` contract is needed, treat it
as an explicit product/API extension. A browser navigation row may require real
link behavior; a command ID callback alone does not provide it.

## What should translate to mobile?

Use the same source, result identity, ordering/grouping, cancellation, loading,
empty/error, and activation contracts on all targets. Present mobile search as
a sheet or full-screen search surface with a visible close/cancel action,
reachable scrollable rows, clear search control, safe-area accommodation, and
keyboard-aware available height. Choose autofocus deliberately: it summons the
soft keyboard and reduces result space. The current top offset of 80 and 360px
panel are desktop-style defaults, not evidence of keyboard-safe mobile layout.

Touch should activate the tapped row directly. Do not require a desktop
highlight before tapping or automatically execute the first remote result when
the user presses the soft-keyboard Search key. A proposed mobile default is
Search submits the query; explicit row tap activates, with a separate deliberate
hardware-keyboard highlight/Enter path. This is a behavioral choice to approve
when implementing, not an existing contract.

Keep desktop hardware-key navigation available on tablets. On touch-only usage,
hide arrow/Enter/Escape instructions in favor of clear/cancel controls. Screen
reader navigation, result announcements, labels and disabled semantics remain
mandatory; DOM `aria-activedescendant` is a web implementation, not a portable
native accessibility API. Astryx is a React/DOM reference here and does not
prove iOS/Android native search-sheet behavior.

## Demos, tests, and verification gaps

- [`ComponentsDemo.tsrx`](../../packages/demos/src/ComponentsDemo.tsrx) opens the
  palette from a button and reuses Edit/Duplicate/disabled Delete menu items.
  It has no shortcut opener, grouping, async source, history, empty state, or
  picker example. Selection updates the shared `lastMenu` state.
- [`CommandPaletteFixture`](../../packages/app/src/parity/fixtures.tsrx) mounts one
  static item in an always-open 200×96 panel. The `command-palette-open` check in
  [`parity-checks.mjs`](../../scripts/parity-checks.mjs) checks frame/background and
  list width for web/iOS/Android/macOS, not search, keyboard, selection, or
  dismissal. Those definitions are not proof that each target passed now.
- An exhaustive repository text search found no dedicated maintained
  CommandPalette behavioral test or probe. `sem impact CommandPaletteProps
--file packages/ui/src/props.ts --tests` found no tests; the TSRX component
  itself was not discoverable by `sem`, so that result alone was insufficient.
- Upstream A9 asserts default/custom slots, bootstrap, grouping, render content,
  selected renderer state, initial emptiness, Escape, pending empty continuity,
  late response after internal close, typing without highlight, hover without
  scroll, keyboard scroll, and loading/count/no-results announcements.
  Part suites cover names/roles, disabled click and selected-vs-highlighted state.
  [`CommandPalette.perf.test.ts`](https://raw.githubusercontent.com/facebook/astryx/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/CommandPalette/CommandPalette.perf.test.ts)
  bounds delegated-hover lookup work at 50 and 500 items; it does not establish
  fuzzy search performance or list virtualization.

Future verification must separate helper tests, renderer/event dispatch,
real OS keyboard/touch input, and screen reader evidence. Add cases for disabled
first result, interleaved groups with preselection, no highlight, IME Enter,
external close/reopen, stale results without `cancel`, rejection, and soft
keyboard occlusion. No screenshot/visual analysis was performed.

## Recommended phasing

1. **Repair basic behavior and make claims accurate (P0).** Establish highlight
   versus selection state, disabled-aware navigation, Enter policy, scoped
   Escape, accessible labels/relationships, and macOS submit/dismiss plumbing.
   Retain web overlay focus isolation. Acceptance: enabled rows are reachable,
   disabled rows never execute, input composition does not activate commands,
   close callbacks do not fire twice, and each supported target's dismissal and
   focus behavior is tested. Resolve Home/End caret behavior intentionally
   rather than blindly copying Astryx's current key interception.
2. **Connect shared search and result states (P1).** Reuse `SearchSource` and the
   static helper, add generic data, stable grouping, bounded scrolling,
   async/loading/empty states, named results, and customizable row content.
   Define rejection/retry, stale result handling, source changes, and cleanup
   for internal/external close and unmount. Acceptance: late results never
   repopulate a closed palette, group render/navigation order agrees, aliases
   work, and loading/no matches/error are distinguishable. Reconcile the demo,
   maintained tests, docs and affected recipes; run `pnpm check:recipes`.
3. **Adapt mobile presentation using the same model (P1).** Build the search-sheet
   analog, touch row activation, visible cancel/clear, soft-keyboard submit
   policy, keyboard-aware scrolling and native accessibility. Acceptance:
   results remain reachable with the keyboard shown, dismissal works on both
   iOS and Android, and hardware-key behavior is verified separately. Keep
   platform leaves' exports/public types aligned.
4. **Add optional customization and source policies (P2).** Footer/input slots,
   picker state, descriptions, and desktop shortcut badges can follow. Add
   fuzzy/ranked sources and recent/frequent bootstrap examples only when a
   consumer needs them; document tie-breaking, per-section ordering, history
   scope/reset and caller-owned persistence. Global open shortcuts and typed
   navigation/action items need explicit app/API decisions. Acceptance: source
   policies are deterministic, and displayed shortcuts match actual app bindings.

Phases 1–3 establish useful parity across desktop and mobile. Phase 4 expands
product capability; fuzzy scoring, persisted usage ranking, error UI, and
first-class navigation semantics exceed the audited Astryx built-in contract.

## Report validation

- `pnpm check:recipes` passed structure and local-link checks; it does not verify
  coverage or runtime behavior. No existing recipe changes are needed for this
  report-only audit.
- All 10 local file links resolve; all 14 distinct pinned raw upstream links
  returned HTTP 200. Git whitespace checks passed.
- `pnpm build:docs` was attempted but blocked before compilation by missing
  `vite` dependencies in this worktree. `pnpm exec oxfmt
docs/notes/astryx-parity-commandpalette.md` was unavailable (`oxfmt` not found).
  Formatting was reviewed manually; site rendering remains unverified.
- The highlighted-Enter documentation mismatch and macOS submit/dismiss wrapper
  mismatch were logged locally in Silo `feedback_observations`. No external
  feedback submission was made.
