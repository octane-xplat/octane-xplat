# `@octane-xplat/context-menu`

Platform-specific context menus for Octane xplat apps: a SwiftUI
`.contextMenu` on iOS, a Material 3 `DropdownMenu` anchored to a hosted
trigger on Android, an in-page right-click menu on web, and a real
experimental `NSMenu` source path on native macOS. Native macOS activation,
responder routing, keyboard/VoiceOver and installed-consumer qualification is
pending.

There is no shared context-menu component. Install the package in the app
that renders a control, then import `SwiftUIContextMenu` from
`@octane-xplat/context-menu/ios`, `MaterialContextMenu` from
`@octane-xplat/context-menu/android`, `ContextMenu` from
`@octane-xplat/context-menu/web`, or `AppKitContextMenu` from
`@octane-xplat/context-menu/macos` in the matching platform-suffixed file.

Install in your existing app with Bun. The macOS entry requires a
[native AppKit app](https://octane-xplat.goddardai.org/macos-native); the renderer supplies
its native menu attachment.

```sh
bun add @octane-xplat/context-menu
```

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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
import { useState } from 'octane'
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text, VStack } from '@octane-xplat/ui'

export function Menu() {
	const [last, setLast] = useState('none')
	return (
		<VStack gap={2}>
			<AppKitContextMenu
				id="trip-actions"
				trigger={() => <Text>Trip actions</Text>}
				items={[{ id: 'rename', title: 'Rename' }]}
				onItemSelected={setLast}
			/>
			<Text>{`Last action: ${last}`}</Text>
		</VStack>
	)
}
```

Menu items are plain data (`{id, title, destructive, disabled, divider}`),
reported back through `onItemSelected(id)`. The iOS entry also accepts an
optional `preview` render function (iOS 16+):

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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

On native macOS, item IDs must be unique strings and titles must be strings.
Changing menu content or its record `id` retires the old session; callback-only
renders preserve it and use the current handler. Empty items remove this
wrapper's menu. Invalid data or a missing native attachment shows a generic
unavailable message while the trigger remains inline. Native child editing menus
and nested wrappers keep their own menu slots. See the
[native macOS lifecycle and remaining limits](../../docs/platform/context-menu.md#native-macos-menus).

```tsx
// NoteActions.macos.tsx — use a record-specific identifier when reusing a row.
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function NoteActions({ noteID }: { noteID: string }) {
	return <AppKitContextMenu id={`note-actions-${noteID}`} items={[{ id: 'rename', title: 'Rename' }]}
		trigger={() => <Text>Right-click this note</Text>} onItemSelected={(id) => console.log(noteID, id)} />
}
```

## How the native menus work

On iOS and Android this leaf exercises subtree embedding: `trigger` is a render
fn whose octane output mounts into a
detached root, and the native menu wraps that subtree — SwiftUI resolves it
through `NativeScriptViewFactory` (the same factory the swift-ui plugin's
`NativeScriptView` uses), and Android through the leaf's
`XplatViewRegistry` + `AndroidView`.
The macOS trigger stays in its original tree, with the menu attached only at
its wrapper. AppKit's documented unhandled right-click propagation supplies
ancestor lookup; actual custom-host routing remains unqualified.

The native implementations are adapted from `@expo/ui` (MIT,
`packages/expo-ui` sdk-57): `ios/ContextMenu/ContextMenu.swift` and
`android/.../ui/menu/DropdownMenu*.kt`. Attribution headers sit on the
ported files.

Continue with [Platform context menus](https://octane-xplat.goddardai.org/context-menu).
