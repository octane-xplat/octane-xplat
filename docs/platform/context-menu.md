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
start with `MoreMenu` in [action controls](../app/interactive-actions.md).
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
/** @jsxImportSource @octane-xplat/jsx */
// Actions.android.tsrx
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { Text, View } from '@octane-xplat/ui'
import { createContext, useContext } from 'octane'

const AccountName = createContext('Guest')
const AccountNameProvider: any = AccountName

function AccountLabel() {
	return <Text>{useContext(AccountName)}</Text>
}

export function Actions() {
	return (
		<AccountNameProvider value="Avery">
			<MaterialContextMenu
				items={[{ id: 'rename', title: 'Rename' }]}
				onItemSelected={(id) => console.log(id)}
				trigger={() => (
					<View className="menu-card">
						<AccountLabel />
					</View>
				)}
			/>
		</AccountNameProvider>
	)
}
```

On Android, the trigger render function is evaluated in the declaring Octane
tree and portals into a NativeScript host inside the platform control, so its
component context is preserved. On iOS, both the trigger and optional preview
portal from the declaring tree into SwiftUI hosts, so they receive the same
provider values and live updates. The following details explain the connection;
you can skip them when using the component:

- iOS resolves the registered view through `NativeScriptViewFactory`
  (the same lookup the swift-ui plugin's `NativeScriptView` performs) and
  attaches `.contextMenu` to it.
- Android resolves it through the leaf's `XplatViewRegistry` (a JS-callable
  Kotlin registry) and embeds it via `AndroidView` inside the compose
  anchor.
- macOS renders the trigger inline — the NSMenu attaches directly to the
  backing `NSView`'s `menu` property, so no detached root is needed.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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
/** @jsxImportSource @octane-xplat/jsx */
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

## Native macOS menus

In a [native AppKit app](macos-native.md), save this as `NoteActions.macos.tsx`
and render it in a screen. Right-click the text and choose Rename to display the
selected action. The experimental macOS source renders the trigger inline and
uses the renderer's native menu attachment; no separate app bridge is needed.
Actual pointer/keyboard/VoiceOver behavior remains pending qualification.

```tsx
import { useState } from 'octane'
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Button, Text, VStack } from '@octane-xplat/ui'

export function NoteActions() {
	const [note, setNote] = useState('note-a'), [last, setLast] = useState('none')
	return <VStack gap={2}>
		<Button label="Switch note" clickAction={() => setNote(note === 'note-a' ? 'note-b' : 'note-a')} />
		<AppKitContextMenu id={`note-actions-${note}`} accessibilityLabel={`Actions for ${note}`}
			items={[{ id: 'rename', title: 'Rename' }, { id: 'archive', title: 'Archive', disabled: true }]}
			trigger={() => <Text>{`Right-click ${note}`}</Text>}
			onItemSelected={(id) => setLast(`${note}:${id}`)} />
		<Text>{`Last action: ${last}`}</Text>
	</VStack>
}
```

Item IDs must be unique strings, and titles must be strings. Changes to any item
content, ordering or record-specific `id` retire the prior menu and request that
native tracking end. Use a record-specific ID or remount when a row starts
representing another record. Equal-content arrays and callback-only changes keep
the native menu; selections reach the current callback. Disabled, removed,
unknown, retired and reentrant actions are ignored. An empty array removes the
wrapper's custom menu; invalid item data or unavailable native attachment displays
a generic message while keeping the trigger content.

```tsx
// EmptyActions.macos.tsx — the trigger remains present without custom actions.
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function EmptyActions() {
	return <AppKitContextMenu items={[]} trigger={() => <Text>No custom actions</Text>} />
}
```

The wrapper sets only its own native menu slot and restores an earlier menu on
cleanup when it still owns that slot. Child controls keep native editing menus;
nested wrappers keep their own actions. This design relies on AppKit's documented
[unhandled right-click propagation](https://developer.apple.com/documentation/appkit/nsview?changes=_5_2),
which also applies when a child is added later. Custom native views that consume
events can alter routing, so ancestor lookup, Control-click, keyboard and AX menu
actions still need target-specific input evidence. `destructive` remains a normal
AppKit row; the flat-item API does not add native submenus or previews.

```tsx
// NestedActions.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text, VStack } from '@octane-xplat/ui'
export function NestedActions() {
	return <AppKitContextMenu items={[{ id: 'outer', title: 'Outer action' }]} trigger={() => <VStack gap={2}>
		<Text>Outer actions</Text>
		<AppKitContextMenu items={[{ id: 'inner', title: 'Inner action' }]}
			trigger={() => <Text>Inner actions</Text>} onItemSelected={(id) => console.log(id)} />
	</VStack>} onItemSelected={(id) => console.log(id)} />
}
```

Eight owner-model and seven actual renderer-branch cases are authored, all unrun.
The maintained demo adds late children, a native text field, nested menus, item/
scope/callback changes, invalid/empty data and remount controls. For tracking-time
checks, choose its delayed record change and open the menu before the timer fires;
host timer progress during native tracking is also unqualified. Its probe only
mounts that demo. Source/fake dispatch does not qualify native menu selection,
responder propagation, tracking/cancellation, focus, VoiceOver, lifecycle timing
or clean installed consumers.

```sh
pnpm probe run examples/probes/native-context-menu.macos.tsrx --target macos --watch
```

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
