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
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
// Actions.android.tsrx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Text, Pressable, View } from '@octane-xplat/ui'
import { createContext, useContext, useState } from 'octane'

const AccountName = createContext('Guest')
const AccountNameProvider: any = AccountName

function AccountLabel() {
	return <Text>{useContext(AccountName)}</Text>
}

export function Actions() {
	const [open, setOpen] = useState(false)

	return (
		<AccountNameProvider value="Avery">
			<MaterialBottomSheet
				open={open}
				onDismissed={() => setOpen(false)}
				skipPartiallyExpanded={false}
				content={() => (
					<View className="sheet-content">
						<AccountLabel />
						<Pressable onPress={() => setOpen(false)}>
							<Text>Close</Text>
						</Pressable>
					</View>
				)}
			/>
		</AccountNameProvider>
	)
}
```

On Android, the content render function is evaluated in the declaring Octane
tree and its result portals into a NativeScript host inside the sheet. That
preserves component context across the window boundary. The iOS implementation
also portals content from the declaring tree into its SwiftUI host. Both
platforms preserve provider values and live updates across the sheet boundary.
These details explain the implementation:

- iOS resolves the registered view through `NativeScriptViewFactory` and
  places it inside `.sheet` content.
- Android resolves it through the leaf's `XplatViewRegistry` and places it
  inside the `ModalBottomSheet`'s dialog window via `AndroidView`.

The hosted subtree keeps its own event handling — `onPress` inside the
sheet content reaches JS normally and can drive `open` back to `false`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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

## Return to editing after closing

The platform presenter owns its sheet's keyboard layout. Keep editing controls
inside `content`, and choose where editing resumes in `onDismissed`. The input
ref supplies a `focus()` operation. This example returns to the draft outside
the sheet after the native dismissal finishes.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, TextInput, View } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'

export function EditorSheet() {
	const [open, setOpen] = useState(false)
	const editing = useRef<TextInputHandle | null>(null)

	return <View>
		<TextInput ref={editing} placeholder="Draft outside the sheet" />
		<Button clickAction={() => setOpen(true)}>Edit in a sheet</Button>
		<SwiftUIBottomSheet open={open} detents={['medium', 'large']}
			onDismissed={() => { setOpen(false); editing.current?.focus() }}
			content={() => <View>
				<TextInput placeholder="Message in the sheet" />
				<Button clickAction={() => setOpen(false)}>Done</Button>
			</View>}
		/>
	</View>
}
```

Android calls `onDismissed` when a swipe, scrim tap, or Back asks the app to
close its dialog. Use one close-and-focus function for that callback and your
own Done action. The return target belongs to the screen that opened it.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Button, TextInput, View } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'

export function AndroidEditorSheet({ open, close, editing }: {
	open: boolean
	close: () => void
	editing: { current: TextInputHandle | null }
}) {
	const finish = () => { close(); editing.current?.focus() }

	return <MaterialBottomSheet open={open} onDismissed={finish}
		content={() => <View>
			<TextInput placeholder="Message in the sheet" />
			<Button clickAction={finish}>Done</Button>
		</View>}
	/>
}
```

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
- **macOS** — use `AppKitSheet` for a document-modal window sheet. Its
  source implementation waits for the anchor's window and portals content from
  the declaring tree. Native execution and packaged consumers are still unqualified.

  ```tsx
  // Details.macos.tsx
  import { AppKitSheet } from '@octane-xplat/sheet/macos'
  import { Text } from '@octane-xplat/ui'

  export function Details({ open }: { open: boolean }) {
      return <AppKitSheet open={open} content={() => <Text>Trip details</Text>} />
  }
  ```

## Native macOS window sheets

Open a sheet from a button and close it after saving. Keep its anchor mounted
inside the intended window. `open` controls the request; `onDismissed` resets
that request after native dismissal. The content portals from the declaring
Octane tree, retaining its providers and live updates.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// TripSheet.macos.tsx
import { createContext, useContext, useState } from 'octane'
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { Button, Text, View } from '@octane-xplat/ui'

const TripName = createContext('Weekend trip')
const TripNameProvider: any = TripName
function TripLabel() {
	return <Text>{useContext(TripName)}</Text>
}
export function TripSheet() {
	const [open, setOpen] = useState(false)
	return <TripNameProvider value="Oslo trip">
		<Button label="Edit trip" clickAction={() => setOpen(true)} />
		<AppKitSheet open={open} className="gap-3 p-4"
			onDismissed={() => setOpen(false)}
			content={() => <View className="gap-3">
				<TripLabel />
				<Button label="Save and close" clickAction={() => setOpen(false)} />
			</View>} />
	</TripNameProvider>
}
```

Use `id` as the record's ownership key when a retained sheet switches records.
Changing the id or native anchor retires the old session before creating a new
one. Unmounting also cleans up silently. Callback-only and content updates keep
that session; dismissal uses the current callback. `className` and `style` apply
to the sheet content host; the anchor carries `id`.

```tsx
// RecordSheet.macos.tsx
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { Text } from '@octane-xplat/ui'
export function RecordSheet({ trip, open, close }: {
	trip: { id: string; name: string }; open: boolean; close: () => void
}) {
	return <AppKitSheet id={`trip-${trip.id}`} open={open}
		className="gap-3 p-4" style={{ minWidth: 420 }}
		onDismissed={close} content={() => <Text>{trip.name}</Text>} />
}
```

The source lifecycle has these boundaries. No parentless floating window is
created. AppKit's [native sheet API](https://developer.apple.com/documentation/appkit/nswindow/beginsheet%28_%3Acompletionhandler%3A%29)
presents or queues the request on the anchor's actual parent window.

| State or action | Source behavior |
| --- | --- |
| `open` before window attachment | Prepare portal content; wait for native anchor attachment |
| Portal commit and attached parent | Measure fitting size, with a 360 × 160 point minimum, then call `beginSheet` |
| Another sheet on the same window | Let AppKit queue this request; closing it calls `endSheet` for this owned window |
| Native end, parent close/loss, or `open` → false after presentation/queueing | Clean up and call the current `onDismissed` once |
| Close before native presentation, unmount, id/anchor replacement | Cancel resources without a dismissal callback |
| Native end while `open` remains true | Stay closed until `open` resets to false then true |
| Missing bridge or native construction/presentation failure | Show a generic unavailable message; close and reopen to retry |

The native window exposes `cancelOperation:` through the responder chain,
leaving text responders first opportunity to consume their key binding. Actual
Escape delivery, IME, Tab order, native close controls, nested sheets, queued
cancellation, fit/layout, focus restoration, VoiceOver and memory behavior still
need AppKit qualification. There are no detents or drag handles in this API.
The [maintained demo](../../packages/demos/src/NativeSheetDemo.macos.tsrx) includes
text entry, provider changes, nested/queued requests, callback/scope changes and
an explicit delayed owner removal. Its idle probe has not run.


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

```tsrx
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
screen-reader navigation. Native modal VoiceOver/TalkBack navigation and physical keyboard navigation
remain unverified. The explicit editing-focus callback above is qualified
separately from those accessibility and OS-input behaviors. See
[text-entry guidance](../app/text-entry.md#release-and-restore-focus) and
[input readiness evidence](../../.agents/docs/notes/input-readiness-notes.md).
