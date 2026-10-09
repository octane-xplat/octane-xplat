# `@octane-xplat/context-menu`

Platform-specific context menus for Octane xplat apps: a SwiftUI
`.contextMenu` on iOS, a Material 3 `DropdownMenu` anchored to a hosted
trigger on Android, an in-page right-click menu on web, and a real
`NSMenu` on the backing view on macOS.

There is no shared context-menu component. Install the package in the app
that renders a control, then import `SwiftUIContextMenu` from
`@octane-xplat/context-menu/ios`, `MaterialContextMenu` from
`@octane-xplat/context-menu/android`, `ContextMenu` from
`@octane-xplat/context-menu/web`, or `AppKitContextMenu` from
`@octane-xplat/context-menu/macos` in the matching platform-suffixed file.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// SwiftUIContextMenuExample.ios.tsx
import { SwiftUIContextMenu } from '@octane-xplat/context-menu/ios'
import { Text } from '@octane-xplat/ui'

export function Menu() {
	return (
		<SwiftUIContextMenu
			trigger={() => <Text>Trip actions</Text>}
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
		/>
	)
}
```

```tsx
/** @jsxImportSource @nativescript-community/octane */
// MaterialContextMenuExample.android.tsx
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { Text } from '@octane-xplat/ui'

export function Menu() {
	return (
		<MaterialContextMenu
			activation="singlePress"
			trigger={() => <Text>Trip actions</Text>}
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
		/>
	)
}
```

```tsx
// ContextMenuExample.web.tsx
import { ContextMenu } from '@octane-xplat/context-menu/web'
import { Text } from '@octane-xplat/ui'

export function Menu() {
	return (
		<ContextMenu
			activation="singlePress"
			trigger={() => <Text>Trip actions</Text>}
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
		/>
	)
}
```

```tsx
// AppKitContextMenuExample.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'

export function Menu() {
	return (
		<AppKitContextMenu
			trigger={() => <Text>Trip actions</Text>}
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
		/>
	)
}
```

Menu items are plain data (`{id, title, destructive, disabled, divider}`),
reported back through `onItemSelected(id)`. The iOS entry also accepts an
optional `preview` render function (iOS 16+):

```tsx
/** @jsxImportSource @nativescript-community/octane */
// Actions.ios.tsx
import { SwiftUIContextMenu } from '@octane-xplat/context-menu/ios'
import { Text } from '@octane-xplat/ui'

export function Actions() {
	return (
		<SwiftUIContextMenu
			trigger={() => <Text>Trip actions</Text>}
			preview={() => <Text>Kyoto trip</Text>}
			items={[{ id: 'delete', title: 'Delete', destructive: true, divider: true }]}
			onItemSelected={(id) => console.log(id)}
		/>
	)
}
```

- iOS: long-press activation (platform native); optional `preview` render fn
  (iOS 16+).
- Android: `activation` prop — `'longPress'` (default) or `'singlePress'`,
  detected at parent level so interactive children in the trigger keep
  their own taps.
- Web: right-click (`longPress`) or click (`singlePress`) opens the menu at
  the pointer.
- macOS: right-click — the NSMenu is the view's `menu`, so AppKit owns
  activation and disabled-item dimming; the trigger renders inline.

## How the native menus work

Unlike props-only leaves (picker, date-picker), this leaf exercises subtree
embedding: `trigger` is a render fn whose octane output mounts into a
detached root, and the native menu wraps that subtree — SwiftUI resolves it
through `NativeScriptViewFactory` (the same factory the swift-ui plugin's
`NativeScriptView` uses), and Android through the leaf's
`XplatViewRegistry` + `AndroidView`.

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/ContextMenu/ContextMenu.swift` and
`android/.../ui/menu/DropdownMenu*.kt`. Attribution headers sit on the
ported files.
