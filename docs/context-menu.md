# Platform context menus

> Show actions for an item when someone holds or right-clicks it.

A **context menu** puts actions such as Rename or Delete next to the item
they affect. `@octane-xplat/context-menu` uses each platform's own menu
appearance. Its components have different names and options, so put them
in matching [platform files](module-resolution.md).

```tsx
// Actions.web.tsrx
import { ContextMenu } from '@octane-xplat/context-menu/web'
import { Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [selected, setSelected] = useState('')
	return (
		<ContextMenu
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
			trigger={() => <Text>Right-click this item</Text>}
		/>
	)
}
```

This is an optional package. For a shared overflow button with actions,
start with `MoreMenu` in [action controls](interactive-actions.md).
The example logs the chosen action ID; replace that callback with your
app’s Rename or Delete action when you connect it to real data.

## Install and import

Run `pnpm add @octane-xplat/context-menu` from your app folder. Import
the platform-specific component from the matching target entry:

- `SwiftUIContextMenu` from `@octane-xplat/context-menu/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialContextMenu` from `@octane-xplat/context-menu/android` in `.android.ts` or `.android.tsrx`.
- `ContextMenu` from `@octane-xplat/context-menu/web` in `.web.ts` or `.web.tsrx`.
- `AppKitContextMenu` from `@octane-xplat/context-menu/macos` in `.macos.ts` or `.macos.tsrx`.

## The trigger is a render fn

The **trigger** is the content someone holds or right-clicks to open the
menu. Supply it as a function that returns your components. The function
in the example returns a card with a text label.

```tsx
// Actions.android.tsrx
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [selected, setSelected] = useState('')
	return (
		<MaterialContextMenu
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
			trigger={() => (
				<View className="menu-card">
					<Text>Post card — hold for actions</Text>
				</View>
			)}
		/>
	)
}
```

On native, that content is drawn in a separate Octane root: its own UI
container inside the platform control. The following details explain how
that connection works; you can skip them when using the component:

- iOS resolves the registered view through `NativeScriptViewFactory`
  (the same lookup the swift-ui plugin's `NativeScriptView` performs) and
  attaches `.contextMenu` to it.
- Android resolves it through the leaf's `XplatViewRegistry` (a JS-callable
  Kotlin registry) and embeds it via `AndroidView` inside the compose
  anchor.
- macOS renders the trigger inline — the NSMenu attaches directly to the
  backing `NSView`'s `menu` property, so no detached root is needed.

```tsx
// Actions.android.tsrx
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [selected, setSelected] = useState('')
	return (
		<MaterialContextMenu
			items={[{ id: 'rename', title: 'Rename' }]}
			onItemSelected={(id) => console.log(id)}
			trigger={() => (
				<View className="menu-card">
					<Text>Post card — hold for actions</Text>
				</View>
			)}
		/>
	)
}
```

## Items and events

Menu content is data: `items` is a list of
`{ id, title, destructive?, disabled?, divider? }`. `divider` draws a
separator before the item. `onItemSelected(id)` reports picks. This keeps
the bridge payload serializable and matches Expo's data-driven menu model
in spirit (their slot children become item records here).

```tsx
// Actions.android.tsrx
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Actions() {
	const [selected, setSelected] = useState('')
	return (
		<MaterialContextMenu
			items={[
				{ id: 'rename', title: 'Rename' },
				{ id: 'delete', title: 'Delete', destructive: true, divider: true },
				{ id: 'archive', title: 'Archive', disabled: true },
			]}
			onItemSelected={(id) => console.log(id)}
			trigger={() => <Text>Hold for actions</Text>}
		/>
	)
}
```

## Platform behavior

- **iOS** — `.contextMenu(menuItems:)` with long-press activation, the
  platform's native menu chrome and destructive-role styling. `preview`
  (another render fn) shows a preview while the menu opens on iOS 16+.
- **Android** — a Material 3 `DropdownMenu` anchored to the hosted trigger.
  `activation` selects the gesture: `'longPress'` (default) or
  `'singlePress'`. Activation is an NS gesture on the trigger host —
  compose gesture detection can't resolve inside `AndroidView`-hosted
  subtrees — and `expanded` is a controlled prop pushed through the bridge.
- **Web** — an in-page menu at the pointer: right-click for `longPress`,
  click for `singlePress`.
- **macOS** — a real `NSMenu` on the backing view, so right-click
  activation and disabled-item dimming come from AppKit. `destructive`
  has no NSMenuItem role — the item renders as a normal row. Activation
  gesture props (`longPress`/`singlePress`) don't exist: right-click is
  the only AppKit convention.

## Port notes — what carried over

The remaining sections are implementation notes for contributors. Native
code is adapted from `@expo/ui` sdk-57 (`ios/ContextMenu/ContextMenu.swift`
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

## Bridge notes — what this leaf proved

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
