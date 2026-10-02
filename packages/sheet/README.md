# `@octane-xplat/sheet`

An install boundary for platform-specific modal bottom sheets: a SwiftUI
`.sheet` presentation on iOS, a Material 3 `ModalBottomSheet` on Android,
a native modal `<dialog>` on web, and a real `NSWindow` sheet
(`beginSheet`) on macOS.
Install the package in the app that renders a control. Import
`SwiftUIBottomSheet` from `@octane-xplat/sheet/ios`,
`MaterialBottomSheet` from `@octane-xplat/sheet/android`, `BottomSheet`
from `@octane-xplat/sheet/web`, or `AppKitSheet` from
`@octane-xplat/sheet/macos` in the matching platform-suffixed file.
There is no shared sheet API at the package root.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// SwiftUIBottomSheetExample.ios.tsx
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'

export function Details() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button onPress={() => setOpen(true)}>Trip details</Button>
			<SwiftUIBottomSheet
				open={open}
				detents={['medium', 'large']}
				showDragIndicator
				onDismissed={() => setOpen(false)}
				content={() => <Text>Two bags packed</Text>}
			/>
		</>
	)
}
```

```tsx
/** @jsxImportSource @nativescript-community/octane */
// MaterialBottomSheetExample.android.tsx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'

export function Details() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button onPress={() => setOpen(true)}>Trip details</Button>
			<MaterialBottomSheet
				open={open}
				skipPartiallyExpanded
				showDragHandle
				onDismissed={() => setOpen(false)}
				content={() => <Text>Two bags packed</Text>}
			/>
		</>
	)
}
```

```tsx
// BottomSheetExample.web.tsx
import { BottomSheet } from '@octane-xplat/sheet/web'
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'

export function Details() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button onPress={() => setOpen(true)}>Trip details</Button>
			<BottomSheet
				open={open}
				onDismissed={() => setOpen(false)}
				content={() => <Text>Two bags packed</Text>}
			/>
		</>
	)
}
```

```tsx
// AppKitSheetExample.macos.tsx
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'

export function Details() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button onPress={() => setOpen(true)}>Trip details</Button>
			<AppKitSheet
				open={open}
				onDismissed={() => setOpen(false)}
				content={() => <Text>Two bags packed</Text>}
			/>
		</>
	)
}
```

Web apps must also import the sheet stylesheet from their app entry:

```ts
import '@octane-xplat/sheet/web/styles.css'
```

Sheet content is a render fn whose octane output mounts into a detached
root — the same embedding mechanism as `@octane-xplat/context-menu`'s
trigger. On iOS the registered view resolves through
`NativeScriptViewFactory`; on Android through the leaf's
`XplatViewRegistry` + `AndroidView` inside the sheet's dialog window.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// HostedContent.android.tsx
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { Text } from '@octane-xplat/ui'

export function HostedContent({ open }: { open: boolean }) {
	return <MaterialBottomSheet open={open} content={() => <Text>Trip details</Text>} />
}
```

- iOS: `open` (controlled `isPresented`), `onDismissed`,
  `onPresentedChange`, `fitToContents` (ported size-reader →
  `.presentationDetents([.height])`), `detents`
  (`medium`/`large`/`fraction`/`height`), `showDragIndicator`,
  `interactiveDismissDisabled`.
- Android: `open` + `onDismissed`, `skipPartiallyExpanded` (the M3 detent
  model: partial vs fully expanded), `showDragHandle`,
  `sheetGesturesEnabled`, `shouldDismissOnBackPress`,
  `shouldDismissOnClickOutside`, and `containerColor`/`contentColor`/
  `scrimColor` hex strings. Activity-owned key events are forwarded while
  the sheet's dialog is open (ported from Expo).
- Web: native modal `<dialog>` with a named panel, focus entry/Tab
  containment, trigger restoration (`finalFocusRef`), Escape and scrim
  dismissal controls, and drag-handle dismissal. `label` supplies the dialog
  name; pass `finalFocusRef` when pointer-opening so focus returns to the
  invoking control across browsers.

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/BottomSheetView.swift` and
`android/.../ui/ModalBottomSheetView.kt`. Attribution headers sit on the
ported files.
