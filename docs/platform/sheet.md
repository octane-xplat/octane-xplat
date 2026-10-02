# Platform modal bottom sheets

> Open a panel above the current screen using the platform's own presentation.

A **bottom sheet** is a panel that opens from the bottom of a screen, often
for extra actions or a short form. Start with the shared `BottomSheet`
from `@octane-xplat/ui` for a common appearance; see
[temporary panels](../app/primitives.md#own-temporary-surfaces).

```tsx
import { BottomSheet, Pressable, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Pressable onPress={() => setOpen(true)}>
				<Text>Open actions</Text>
			</Pressable>
			<BottomSheet label="Actions" isOpen={open} onOpenChange={setOpen}>
				<Pressable onPress={() => setOpen(false)}>
					<Text>Close</Text>
				</Pressable>
			</BottomSheet>
		</>
	)
}
```

## Install and import

Run `pnpm add @octane-xplat/sheet` from your app folder. Import the
platform-specific component from the matching target entry:

- `SwiftUIBottomSheet` from `@octane-xplat/sheet/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialBottomSheet` from `@octane-xplat/sheet/android` in `.android.ts` or `.android.tsrx`.
- `BottomSheet` from `@octane-xplat/sheet/web` in `.web.ts` or `.web.tsrx`.
- `AppKitSheet` from `@octane-xplat/sheet/macos` in `.macos.ts` or `.macos.tsrx`.

Use the optional `@octane-xplat/sheet` package when you want the platform's
own presentation. The iOS and Android panels use their native UI systems;
macOS uses a window sheet, and web uses a fixed panel. Each has its own name
and options, so keep it in a matching [platform file](module-resolution.md).
The Android example below owns its `open` state and provides opening and
closing actions.

Import the sheet's stylesheet once from the web app entry:

```ts
import '@octane-xplat/sheet/web/styles.css'
```

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Actions.android.tsrx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Pressable, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Pressable onPress={() => setOpen(true)}>
				<Text>Open actions</Text>
			</Pressable>
			<MaterialBottomSheet
				open={open}
				onDismissed={() => setOpen(false)}
				content={() => (
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close</Text>
					</Pressable>
				)}
			/>
		</>
	)
}
```

## Content is a render fn

Supply `content` as a function that returns the components to show in the
panel. “Render fn” means that content-producing function. Buttons inside
it can call your callbacks, such as `setOpen(false)` to close the panel.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Actions.android.tsrx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Text, Pressable, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [open, setOpen] = useState(false)
	return (
		<MaterialBottomSheet
			open={open}
			onDismissed={() => setOpen(false)}
			skipPartiallyExpanded={false}
			content={() => (
				<View className="sheet-content">
					<Text>More</Text>
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close</Text>
					</Pressable>
				</View>
			)}
		/>
	)
}
```

On native, the content is drawn in a separate Octane root: its own UI
container inside the sheet. These details explain the implementation:

- iOS resolves the registered view through `NativeScriptViewFactory` and
  places it inside `.sheet` content.
- Android resolves it through the leaf's `XplatViewRegistry` and places it
  inside the `ModalBottomSheet`'s dialog window via `AndroidView`.

The hosted subtree keeps its own event handling — `onPress` inside the
sheet content reaches JS normally and can drive `open` back to `false`.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Actions.android.tsrx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Text, Pressable, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [open, setOpen] = useState(false)
	return (
		<MaterialBottomSheet
			open={open}
			onDismissed={() => setOpen(false)}
			skipPartiallyExpanded={false}
			content={() => (
				<View className="sheet-content">
					<Text>More</Text>
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close</Text>
					</Pressable>
				</View>
			)}
		/>
	)
}
```

## Open state is controlled

Your app decides whether the panel is open by supplying `open`. Update that
value when opening it or when `onDismissed` reports that someone closed it.
This is a **controlled** component.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Actions.android.tsrx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Text, Pressable, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [open, setOpen] = useState(false)
	return (
		<MaterialBottomSheet
			open={open}
			onDismissed={() => setOpen(false)}
			skipPartiallyExpanded={false}
			content={() => (
				<View className="sheet-content">
					<Text>More</Text>
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close</Text>
					</Pressable>
				</View>
			)}
		/>
	)
}
```

- `open` controls presentation on all entries.
- `onDismissed` fires when the platform dismisses — swipe-down or
  scrim/outside tap on Android (via `ModalBottomSheet.onDismissRequest`),
  sheet dismiss on iOS (via `onDismiss`), and enabled Escape, scrim click, or
  drag-handle swipe on web.
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
- **Web** — a native modal `<dialog>` in the browser top layer. `label` names
  the dialog; focus enters the first usable control, Tab stays in the sheet,
  and focus returns to `finalFocusRef` on close. Escape maps to
  `shouldDismissOnBackPress`, scrim click maps to
  `shouldDismissOnClickOutside`, and dragging the handle maps to
  `sheetGesturesEnabled`. The web leaf applies `id`, `className`, `style`, and
  the container/content/scrim colors. Its height budget is 60vh by default and
  90vh when `skipPartiallyExpanded` is true.
- **macOS** — a real AppKit window sheet (`beginSheet` on the leaf's
  window), falling back to a floating window without a parent. There are
  no detents or drag handles on macOS — the window sizes to the
  content's fitting size and `onDismissed` fires when the sheet ends
  (close button, Esc, or `open`→false). The content subtree mounts as
  its own octane root inside the sheet window via `createMacOSRoot`.

## Port notes — what carried over

These sections are implementation notes for contributors. Native code is
adapted from `@expo/ui` sdk-57 (`ios/BottomSheetView.swift` and
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

Provide a named opening action, a meaningful `label`, and a visible close
action inside the content. The leaf's Web focus, keyboard containment,
dismissal, styling, and trigger restoration pass the maintained Playwright
runtime check in Chromium, Firefox, and WebKit. Keep a ref to the opener and
pass it as `finalFocusRef` so focus returns reliably after pointer input:

```tsx
import { useRef, useState } from 'octane'
import { BottomSheet } from '@octane-xplat/sheet/web'

function AccountActions() @{
	const [open, setOpen] = useState(false)
	const trigger = useRef<HTMLButtonElement | null>(null)

	<>
		<button ref={trigger} onClick={() => setOpen(true)}>Open actions</button>
		<BottomSheet
			open={open}
			label="Account actions"
			finalFocusRef={trigger}
			onDismissed={() => setOpen(false)}
			content={() => <button onClick={() => setOpen(false)}>Close</button>}
		/>
	</>
}
```

When the opener is the shared `Pressable`, use its `ref` prop to retain the
web element in the same ref. This does not qualify iOS Safari or actual
screen-reader navigation. Native modal VoiceOver/TalkBack navigation and
return focus also remain unverified. See
[text-entry guidance](../app/text-entry.md#release-and-restore-focus) and
[input readiness evidence](../notes/input-readiness-notes.md).
