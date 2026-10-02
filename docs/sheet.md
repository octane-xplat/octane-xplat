# Platform modal bottom sheets

> Present an octane subtree inside a platform-specific modal bottom sheet
> through an explicit package entry point.

`@octane-xplat/sheet` is the fourth Expo UI port and exercises the hardest
bridge seam: a detached octane root hosted inside a _modal presentation in
a separate window_ — a SwiftUI `.sheet` on iOS, a `ModalBottomSheet`
dialog on Android, a fixed DOM panel on web. Native implementations are
adapted from `@expo/ui` sdk-57 (`ios/BottomSheetView.swift`,
`android/.../ui/ModalBottomSheetView.kt`; MIT — attribution headers on the
ported files).

## Install and import

Add `@octane-xplat/sheet` to the app that renders a control. Import the
platform-specific component from the matching target entry:

- `SwiftUIBottomSheet` from `@octane-xplat/sheet/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialBottomSheet` from `@octane-xplat/sheet/android` in `.android.ts` or `.android.tsrx`.
- `BottomSheet` from `@octane-xplat/sheet/web` in `.web.ts` or `.web.tsrx`.
- `AppKitSheet` from `@octane-xplat/sheet/macos` in `.macos.ts` or `.macos.tsrx`.

```tsx
<MaterialBottomSheet
	open={open}
	onDismissed={() => setOpen(false)}
	skipPartiallyExpanded={false}
	content={() => (
		<View className="gap-3 p-5">
			<Heading>More</Heading>
			<Pressable onPress={() => setOpen(false)}>
				<Text>Close</Text>
			</Pressable>
		</View>
	)}
/>
```

## Content is a render fn

`content` produces an octane subtree that mounts into a detached
`createNativeScriptRoot` host — the same mechanism as the context-menu
trigger:

- iOS resolves the registered view through `NativeScriptViewFactory` and
  places it inside `.sheet` content.
- Android resolves it through the leaf's `XplatViewRegistry` and places it
  inside the `ModalBottomSheet`'s dialog window via `AndroidView`.

The hosted subtree keeps its own event handling — `onPress` inside the
sheet content reaches JS normally and can drive `open` back to `false`.

## Open state is controlled

- `open` controls presentation on all entries.
- `onDismissed` fires when the platform dismisses — swipe-down or
  scrim/outside tap on Android (via `ModalBottomSheet.onDismissRequest`),
  sheet dismiss on iOS (via `onDismiss`), scrim click on web.
- `onPresentedChange` (iOS) reports platform-side presentation state with
  Expo's echo suppression.

## Platform behavior

- **iOS** — `.sheet(isPresented:)` with `detents`
  (`medium`/`large`/`fraction`/`height` via `customFraction`/`customHeight`
  — `presentationDetents`, iOS 16+), `showDragIndicator`,
  `interactiveDismissDisabled`, and `fitToContents` (ported size-reader →
  `.presentationDetents([.height(size)])`).
- **Android** — M3 `ModalBottomSheet` in a dialog window:
  `skipPartiallyExpanded` (the M3 detent model — partial vs fully
  expanded), `showDragHandle`, `shouldDismissOnBackPress`,
  `containerColor`/`contentColor`/`scrimColor` hex strings. Activity-owned
  key events are forwarded while the sheet is open (ported from Expo).
  `sheetGesturesEnabled`/`shouldDismissOnClickOutside` are accepted but
  ignored — the resolved material3 predates those parameters.
- **Web** — a scrim + fixed bottom panel, scrim-click dismiss.
- **macOS** — a real AppKit window sheet (`beginSheet` on the leaf's
  window), falling back to a floating window without a parent. There are
  no detents or drag handles on macOS — the window sizes to the
  content's fitting size and `onDismissed` fires when the sheet ends
  (close button, Esc, or `open`→false). The content subtree mounts as
  its own octane root inside the sheet window via `createMacOSRoot`.

## Port notes — what carried over

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

## Bridge notes — what this leaf proved

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

## Focus qualification

Provide a named opening action and a visible close action inside the content.
The leaf's web `BottomSheet` has not been qualified for keyboard focus
containment or trigger restoration. Native modal VoiceOver/TalkBack navigation
and return focus also remain unverified. The shared `@octane-xplat/ui` Sheet
uses a different implementation; its browser focus results do not cover this
leaf. See [text-entry guidance](text-entry.md#release-and-restore-focus) and
[input readiness evidence](input-readiness-notes.md).
