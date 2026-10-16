# Portal ownership across native boundaries

> Contributor contract. App-building examples: [scoped sheets and modals](../../../docs/app/primitives.md#own-temporary-surfaces), [native route providers](../../../docs/app/navigation.md#preserve-providers-across-native-pages).

Portals keep content in its declaring Octane tree while another native view
hosts its pixels. The providers around the mounted outlet determine context;
the location of an imperative handler does not capture context by itself.

| Boundary | Ownership |
| --- | --- |
| Native pushed Pages and route modals | `RouteOutlet` for each stack, or `useNativeRouteNavigator().element` for local scope |
| Imperative shared sheets | `useImperativeBottomSheet().element` on web, iOS, Android, and macOS |
| Imperative OS modals | `useImperativeModal().element` on iOS and Android |
| iOS UITableView / Android RecyclerView | Platform component owns portals into template-created cell hosts |
| Compiled AppKit tabviewitem / listview renderItem | Compiler wrappers own portals; raw handles/native delegates retain native ownership |
| AppKit shared Dialog, standalone BottomSheet, Lightbox | Declaring component owns portal content through the common surface presenter |
| AppKit BottomSheetSwitcher, toast viewport, anchored useLayer popups | Retain their current roots; registry/anchored content needs separate portal qualification |
| App/bootstrap/independent window trees | Remain Octane roots |
| Ownerless global services and native routing without an outlet | Retain standalone-root fallback; pass data explicitly |

## Source ownership

Keep the returned element mounted below every provider the content needs.
Removing it disposes all owned content and closes its pending service handles.
Opening through a removed service owner rejects; closing before commit prevents
presentation. Each handle remains independent when multiple sheets are open.

```tsx
import { useImperativeBottomSheet, Button } from '@octane-xplat/ui'

function Picker(props: { close: (value?: string) => void }) {
    return <Button clickAction={() => props.close('saved')}>Save</Button>
}
export function Actions() {
    const sheet = useImperativeBottomSheet()
    return <>
        <Button clickAction={() => { void sheet.open(Picker) }}>Choose</Button>
        {sheet.element}
    </>
}
```

The internal `ContentOwner.createRoot` creates a logical portal slot, never an
Octane root. Content commits before native navigation/presentation starts.
Declarative AppKit surfaces render their portals directly; publishing those
children through an imperative store can cause a render/update feedback loop.
Native host theme classes remain necessary because view-tree class inheritance
does not cross a portal target. A source owner hidden in a Frame's backstack
presents shared sheets in that Frame's currently visible Screen.

```ts
// Internal protocol; standalone roots commit synchronously.
interface ContentRoot {
    render(component: unknown, props?: unknown): void
    unmount(): void
    whenCommitted(callback: () => void): void
}
```

## Routes and backstack lifetime

A native route request snapshots its owner before guards/loaders. A disposed
owner cannot revive an async route. Pages remain mounted while current or in
the native backstack, receive context updates while hidden, and release their
portals when popped. Ordinary unload events do not imply disposal. Removing
an owner returns its Frame to the Page that declared the owner; later Pages
above that branch leave with it. Keep app-wide outlets long-lived.

```tsx
import { RouteOutlet, Screen, Text } from '@octane-xplat/ui'
export function Shell() {
    return <Screen><RouteOutlet stack="root"><Text>Home</Text></RouteOutlet></Screen>
}
```

For a screen-local provider use the explicitly bound NativeScript navigator.
Swap-pane tab routes already render in their pane tree and keep that behavior.
Global `pushRoute` resolves the mounted outlet for the target stack; it cannot
infer a local provider around an arbitrary button.

```tsx
import { useNativeRouteNavigator } from '@octane-xplat/ui/nativescript'
import { Button } from '@octane-xplat/ui'
export function LocalActions() {
    const navigation = useNativeRouteNavigator('root')
    return <>
        <Button clickAction={() => navigation.push({ name: 'settings', params: {} })}>Settings</Button>
        {navigation.element}
    </>
}
```

## Raw AppKit controls

The standard macOS compiler rewrites raw `tabviewitem` and `listview` tags to
internal source-owned wrappers. Tab refs still expose logical item handles;
list refs still expose native list views. Props, keys, children, and refs pass
through. Keep the standard `xplatMacOS` compiler setup when using raw controls.
Tab content mounts on assignment, retains identity during reorder/transfer,
and releases on unassignment. List slots follow physical cells with binding
generations so old release events cannot remove a newer portal. Uncompiled
manual host construction retains the legacy driver fallback. Native string
templates, native view factories, and default string rows retain their existing
driver protocol; the source-owned list wrapper handles `renderItem` content.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function NativeTabs() {
    return <tabview><tabviewitem title="Home"><label text="Home" /></tabviewitem></tabview>
}
```

## Evidence and limits

Maintained native runtime fixtures exercise real NativeScript/AppKit hosts;
object-driver tests cover ownership and callback contracts separately.

| Fixture | Runtime evidence |
| --- | --- |
| `packages/ui/tests/fixtures/owned-boundaries.ios.tsrx` | iOS: 13 assertions covering modal/sheet context, live updates, independent results, list scroll/rebind/replacement, teardown |
| `packages/ui/tests/fixtures/owned-boundaries.android.tsrx` | Android: same 13 assertions with RecyclerView |
| `packages/ui/tests/fixtures/owned-routes.ios.tsrx` | iOS: 17 assertions covering route context, hidden Page updates/state retention, modal pop, local ownership, canceled loader, owner teardown, hidden-owner sheet, and UITabBar named Frame routes |
| `packages/ui/tests/fixtures/owned-routes.android.tsrx` | Android: the same 14 route assertions, including deferred Frame backstack commit during owner teardown |
| `packages/macos-renderer/test/fixtures/owned-boundaries.macos.tsrx` | AppKit: 13 assertions, including tab handle transfer without remount and list row 80 replacement |
| `packages/ui/tests/fixtures/owned-surfaces.macos.tsrx` | AppKit: scoped sheets, Dialog, standalone BottomSheet and Lightbox caption context, updates and cleanup; see Silo for actual runtime outcome |
| `packages/ui/tests/fixtures/owned-boundaries.web.tsrx` | Chromium: 10 assertions covering precommit cancellation, nearest context, updates, independent handles and owner teardown |

The attempted AppKit registry/toast cutover did not qualify. Publishing
registrations back into their source tree caused repeated updates; a later
combined registry/toast probe still crashed. `BottomSheetSwitcher` and toast
stacks therefore retain their existing roots. Anchored `useLayer` popups also
still use a separate root and need a source-owned target bridge. These paths
remain explicit follow-up work alongside the completed route/service/tab/list
migrations. Native string templates and manually created
hosts also retain their legacy driver protocol.

The iOS Pager probe is also qualified after resolving the isolated runner's
upstream style-property import through Core's existing entry point. None of
these programmatic checks establishes OS swipes, interactive-back cancellation,
OS keyboard/focus traversal, accessibility, or visual parity. No screenshots
were inspected. Existing platform list scrolling/viewability and service
presentation options remain on their existing native paths.

Two runtime failures found during this cutover are fixed: Android's inset
listener uses the actual AndroidX interface and shared decor-view ownership;
Octane's DOM provider now releases descendants when children become null or
undefined. AppKit surface layout tolerates an empty panel before a portal
commits. Maintained regressions cover those contracts.

Windows and Linux were not run for this cutover. The reported runtime evidence
is limited to web, iOS, Android, and macOS.
