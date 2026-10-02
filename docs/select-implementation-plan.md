# Select family implementation plan

Implement the finite-list foundations identified by [the Astryx audit](astryx-parity-select.md).
Keep remote search, free-text tokens, custom dialogs, and structured filters in
Typeahead, Tokenizer, ComplexSelector, and PowerSearch respectively.

## This implementation

1. Share a DOM-free selection model across Select leaves: controlled/default
   state, visible-option filtering, grouped rows, disabled/read-only disclosure
   guards, filtered enabled-item select-all, trigger summaries, and async commit
   lifecycle. Preserve existing `searchable`, `multiple`, and callback names.
2. Extend `SelectOption` with grouping/supporting text and Select props with
   search/empty copy, bulk selection, count/label summaries, HTML submission,
   and `changeAction`/`onChangeError`. Narrow `MultiSelectorProps` to arrays while
   keeping Select's existing union for compatibility.
3. Give web Select a single composite-widget focus owner, active-descendant
   linkage, arrow/endpoint navigation, printable matching, IME guards, local
   Escape/Tab handling, focus restoration, and polite result/selection feedback.
4. Give mobile/AppKit explicit selected/disabled option feedback, search clear,
   bounded scrolling, empty/loading feedback, bulk selection, and matching commit
   state. Connect AppKit Popover to the existing anchored popup bridge and reconcile
   outside closes; do not claim hardware-keyboard support without an adapter.
5. Add focused regression tests and a maintained Select probe; update the demo,
   search-selection guide, recipe, and audit progress. Record recipe coverage and
   verification separately in Silo.

## Commit and rejection contract

Selection changes call `onValueChange` immediately. `changeAction` may settle
asynchronously; pending commits display optimistically and block another edit.
A rejected action restores the prior uncontrolled selection. For controlled
selection, restore only when the parent still holds the submitted value, so a
newer external value is not overwritten. `onChangeError` receives the rejection.
Loading supplied by the caller remains independent and does not prevent selecting
existing options. Closing or disabling a control hides its surface; disposal
prevents late callbacks.

## Verification

Run focused web component/model tests, UI package builds, web/mobile/macOS
typechecks, recipe/CSS/platform checks, and `pnpm probe doctor` followed by
Select probe runs on available targets. Distinguish build evidence, handler
probe evidence, real keyboard input, and screen-reader verification. Record
unavailable targets and pre-existing failures rather than treating them as passes.
No visual analysis, new dependencies, publication, or CHANGELOG edits.

## Follow-on work

Adaptive modal sheets, complete standalone Field chrome, selectable badge/token
summaries, selected-row overlay alignment, browser top-layer hosting, and native
hardware-keyboard navigation remain separate follow-on contracts. Their absence
must stay explicit in the guide/audit; this plan does not claim full Astryx parity.
