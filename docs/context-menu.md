# Platform context menus

> Attach a platform-specific context menu to an octane subtree through an
> explicit package entry point.

`@octane-xplat/context-menu` is the third Expo UI port and the first that
embeds an octane subtree *inside* the native control: the menu trigger is a
detached octane root hosted by the platform view system, while the menu
content travels as serialized data. The native implementations are adapted
from `@expo/ui` sdk-57 (`ios/ContextMenu/ContextMenu.swift`,
`android/.../ui/menu/DropdownMenu*.kt`; MIT — attribution headers sit on the
ported files).

## Install and import

Add `@octane-xplat/context-menu` to the app that renders a control. Import
the platform-specific component from the matching target entry:

- `SwiftUIContextMenu` from `@octane-xplat/context-menu/ios` in `.ios.ts` or `.ios.tsrx`.
- `MaterialContextMenu` from `@octane-xplat/context-menu/android` in `.android.ts` or `.android.tsrx`.
- `ContextMenu` from `@octane-xplat/context-menu/web` in `.web.ts` or `.web.tsrx`.
- `AppKitContextMenu` from `@octane-xplat/context-menu/macos` in `.macos.ts` or `.macos.tsrx`.

## The trigger is a render fn

Each entry takes `trigger` — a render fn whose output mounts into a
detached octane root. The leaf registers the host's native view and the
native side embeds it:

- iOS resolves the registered view through `NativeScriptViewFactory`
  (the same lookup the swift-ui plugin's `NativeScriptView` performs) and
  attaches `.contextMenu` to it.
- Android resolves it through the leaf's `XplatViewRegistry` (a JS-callable
  Kotlin registry) and embeds it via `AndroidView` inside the compose
  anchor.
- macOS renders the trigger inline — the NSMenu attaches directly to the
  backing `NSView`'s `menu` property, so no detached root is needed.

```tsx
<MaterialContextMenu
	items={items}
	onItemSelected={(id) => act(id)}
	trigger={() => (
		<View className="rounded-lg border p-4">
			<Text>Post card — hold for actions</Text>
		</View>
	)}
/>
```

## Items and events

Menu content is data: `items` is a list of
`{ id, title, destructive?, disabled?, divider? }`. `divider` draws a
separator before the item. `onItemSelected(id)` reports picks. This keeps
the bridge payload serializable and matches Expo's data-driven menu model
in spirit (their slot children become item records here).

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
