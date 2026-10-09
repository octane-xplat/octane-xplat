# `@octane-xplat/sheet`

Platform-native modal bottom sheets: a SwiftUI `.sheet` presentation on iOS, a
Material 3 `ModalBottomSheet` on Android, a native modal `<dialog>` on web, and
a real `NSWindow` sheet (`beginSheet`) on macOS. Use it when you want the
OS-authentic sheet rather than a shared look.

```sh
pnpm add @octane-xplat/sheet
```

There is no shared sheet API at the package root. Each platform entry exports
its own component and types; import it from the platform subpath in a matching
platform-suffixed file:

| File suffix | Import | Component |
| --- | --- | --- |
| `*.ios.tsx` | `@octane-xplat/sheet/ios` | `SwiftUIBottomSheet` |
| `*.android.tsx` | `@octane-xplat/sheet/android` | `MaterialBottomSheet` |
| `*.web.tsx` | `@octane-xplat/sheet/web` | `BottomSheet` |
| `*.macos.tsx` | `@octane-xplat/sheet/macos` | `AppKitSheet` |

All four share the same core shape — `open` to control visibility,
`onDismissed`, and a `content` render function:

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Details.ios.tsx
import { useState } from 'octane'
import { Button, Text } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'

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

Sheet content mounts into a detached root — the same embedding mechanism as
`@octane-xplat/context-menu`'s trigger. On iOS the registered view resolves
through `NativeScriptViewFactory`; on Android through the leaf's
`XplatViewRegistry` + `AndroidView` inside the sheet's dialog window.

Web apps must also import the sheet stylesheet from their app entry:

```ts
import '@octane-xplat/sheet/web/styles.css'
```

## Per-platform props

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
