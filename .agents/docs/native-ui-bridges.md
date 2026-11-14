# Hosted native UI bridges

Implementation guidance for contributors changing the context-menu and sheet
leaves. App authors use [context menus](../../docs/platform/context-menu.md)
and [sheets](../../docs/platform/sheet.md). Attribution remains in the native
source files.

## Context menus

### Port notes — what carried over

Native code is adapted from `@expo/ui` sdk-57 (`ios/ContextMenu/ContextMenu.swift`
and `android/.../ui/menu/DropdownMenu*.kt`), under the MIT license.
Attribution headers are retained in the source files.

- iOS: the trigger/preview branch (`ContextMenuWithPreview` vs the plain
  long-press variant) maps directly; children slot views became the
  registered-view trigger + preview hosts.
- Android: `DropdownMenu` + `DropdownMenuItem` structure, `enabled`
  handling, and the `activationMethod` prop. Not ported: `ModifierRegistry`
  modifier lists (our bridge carries serialized item data instead of
  composed views), element-colors records, and the `expanded` JS-controlled
  prop — our `expanded` is controlled from the trigger's gesture instead.

### Bridge notes — what this leaf proved

- A detached `createNativeScriptRoot(host)` subtree can live inside a
  Compose `AndroidView` once the host's native view exists (`_setupAsRootView`
  needs a real `android.content.Context` — the plugin's `{}` shortcut does
  not marshal on Android) and its id is registered before the provider
  composes the host (`triggerId` is gated on post-registration state).
- The same subtree can live inside SwiftUI through
  `NativeScriptViewFactory.getViewById` — the plugin's own
  `NativeScriptView`/`NativeScriptViewRepresentable` is module-internal, so
  the leaf re-declares a `UIViewRepresentable` with the same lookup.
- Compose gesture detectors can't see activation inside an embedded
  `AndroidView` subtree; the NS `longPress`/`tap` gestures on the trigger
  host are the reliable activation path, with `expanded` controlled through
  `updateData`.

## Sheets

### Port notes — what carried over

Native code is adapted from `@expo/ui` sdk-57 (`ios/BottomSheetView.swift` and
`android/.../ui/ModalBottomSheetView.kt`), under the MIT license.
Attribution headers are retained in the source files.

- iOS: `isPresented` + `onIsPresentedChange`/`onDismiss` event pair, the
`fitToContents` PreferenceKey size-reader and `.presentationDetents`
branching, the anchor-attached `.sheet`. Slot children became the
`content` render fn; `detents`/`customHeight`/`customFraction` map the
modifier registry's `presentationDetents` params directly.
- Android: `ModalBottomSheet` + `rememberModalBottomSheetState(
skipPartiallyExpanded)`, `properties.shouldDismissOnBackPress`,
container/content/scrim colors, `ForwardKeyEventsToActivity`. Not
ported: imperative `hide`/`expand`/`partialExpand` handles (controlled
`open` covers the demo's needs — escalate if a real app needs them),
the `dragHandle` slot view, modifier lists, `initialFullyExpanded`,
`sheetGesturesEnabled`/`shouldDismissOnClickOutside` (unavailable on
the resolved material3).

### Bridge notes — what this leaf proved

- A hosted subtree survives a window boundary: the same
registry + `AndroidView` pattern that embeds a trigger inside a
ComposeView also embeds sheet content inside the `ModalBottomSheet`'s
separate dialog window, and its `onPress` handlers still reach JS.
- `ns build`'s `buildMetadata` gradle task can stay `UP-TO-DATE` and
ship stale `com.` package metadata for a newly added plugin — the JS
bridge then fails with `Cannot read properties of undefined (reading
'<ClassName>')` even though the classes are in the dex. Rerun
`./gradlew app:buildMetadata --rerun-tasks` (in `platforms/android`) or
clean to force regeneration.
- The `XplatViewRegistry` pattern is now written twice — context-menu and
sheet keep leaf-local copies; that duplication is a data point for the
shared-bridge decision rather than a reason to import across leaves.

## Date pickers

### Port constraints

- iOS: the range-branching `DatePicker` construction, selection echo
  suppression, `labelsHidden` when untitled, the `.graphical` style's 320pt
  min-width workaround for the UICalendarView shrink bug
  ([expo#47062](https://github.com/expo/expo/issues/47062)), and the
  `displayedComponents` → `DatePicker.Components` mapping. Not ported:
  children-as-label (the picker takes a `title` string), tvOS guards.
- Android: `SelectableDates` range derivation, the `yearRange` fix for
  bounded calendars ([expo#47206](https://github.com/expo/expo/issues/47206)),
  the `LocalContentColor` binding so the year-selector chevron honors
  `navigationContentColor`, and both element-color tables (as hex strings —
  the bridge does not carry `ColorValue` ints). Not ported: the
  `DatePickerDialog`/`TimePickerDialog` wrappers and their keyboard
  soft-input handling; `dateAndTime` combined input.
