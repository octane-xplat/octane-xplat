# Command palette implementation plan

> Close the core gaps identified in [the Astryx audit](astryx-parity-commandpalette.md)
> while preserving existing static-menu callsites.

1. Add a DOM-free controller for static/source-backed results, stable grouped
   ordering, disabled-aware highlight/selection, cancellation, stale-response
   rejection, external-close/source-change cleanup, and loading/error states.
   Preserve `open`, `items`, and menu callbacks; add optional source/picker/render
   APIs in `props.ts`. Static substring matching remains the default; opt-in fuzzy
   matching ranks exact/prefix/substring/subsequence matches without dependencies.
2. Wire web input/result semantics, arrow/PageUp/PageDown navigation, highlighted
   Enter, IME guards, hover without scrolling, bounded results, labels, live
   status, and footer hints. Keep Home/End for text-caret movement and preserve
   the existing modal focus isolation and return behavior.
3. Share the controller with native leaves. Use the existing mobile bottom sheet
   with bounded scrollable results and visible Cancel/Clear. Mobile submit searches
   rather than executing a result. Add macOS controls using its supported renderer
   events; report any remaining native key/layer constraints precisely.
4. Add focused controller and web component regressions, plus a platform probe.
   Update a maintained demo, usage guide, and recipe; record criterion coverage
   separately from verification in Silo. Run package builds/typechecks, recipe
   checks, and available web/mobile/macOS probes. Never claim event dispatch proves
   OS input or accessibility navigation. Commit implementation and evidence without
   changing the generated changelog or publishing.

Recent/frequent bootstrap results and application shortcut/action routing remain
caller-owned policies. No persistent usage tracking or global hotkey is introduced.

## Delivered and verified

The four phases above are implemented: a shared source/controller and opt-in
static fuzzy matcher; grouped desktop navigation and named modal/combobox status;
a mobile search sheet; and AppKit text-change/key adapters. Loading, distinct
empty states, error/Retry, custom rows/footer, selected ID, and close/reopen cleanup
share the public contract. Demos, the [usage guide](../app/command-palette.md), and recipe
`search-and-token-entry` AC7 document that contract.

Verification on this worktree:

- 16 focused tests pass (controller, web component, mocked AppKit input adapter).
- `pnpm --filter @octane-xplat/ui build` passes web/native bundles, declaration
  generation, and the native-dist dependency guard. `pnpm typecheck:macos` passes.
- Chromium probe: 4/4 assertions, fuzzy aliases, keyboard-dispatched selection,
  close and clean reopen. Run `0458c56c-4865-4c34-ba5e-c2b417c74d60`.
- AppKit/JavaScriptCore probe: 5/5 assertions, fuzzy aliases, action-dispatched
  selection, close/reopen and Cancel. Run `edf14d3d-d6c1-4e5e-abfa-d1021caeeaef`.
  This does not prove OS keyboard input or hit testing.
- iOS simulator probe attempted after a shared simulator lock cleared. It failed
  before assertions: `NativeClass is not defined` in the existing BottomSheet
  tap-to-blur host code. Android had no available device; no runtime pass is claimed
  for either mobile target.
- Docs app build, recipe structure/link checks, CSS normalization check, and
  focused helper lint pass. Repository-wide web/mobile typechecks and DOM-reference
  sweep remain blocked by errors in untouched files (VideoDemo implicit-any errors;
  mobile app/example/table typing and missing styled-system modules; existing DOM
  reference sweep findings). No CommandPalette typecheck diagnostics were reported.

## Remaining work

Native macOS still needs a real modal/layer surface and scrolling the keyboard
highlight into view. Its local key monitor and input observer have mocked unit
coverage, but actual keyboard/IME/VoiceOver behavior needs host verification.
Mobile hardware-key navigation remains deferred; software Search reruns the query
and taps execute commands. The sheet's keyboard lift, touch hit testing, native
status announcements, and assistive-technology behavior need device verification
once the probe host works. Web screen-reader and actual OS keyboard checks also
remain separate from dispatched-event coverage.

No human decision blocked this implementation. History persistence, global opener
bindings, action/navigation routing, source debounce/cache and large-list
virtualization remain explicitly caller-owned or later work rather than hidden
component policies.
