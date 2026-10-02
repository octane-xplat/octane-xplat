# Navigation

The framework owns the API; each platform provides the mechanism.
`pushRoute`/`popRoute`/`useRoute` are real on **both** targets — web is a
URL store over history; native root routes use `Frame`/`Page` stacks. The
shared `Tabs` is a self-drawn row and one swapped pane. Platform-authentic
`UITabBar`/`BottomNavigationView` components live in the native subpaths.

```ts
import { pushRoute, popRoute, registerScreens } from '@octane-xplat/ui'
import { navigate, goBack } from '@xplat/app'

navigate('demo/:id', { id: 'counter' }, { into: 'demos' })
goBack({ into: 'demos' })
pushRoute({ stack: 'root', name: 'demo/:id', params: { id: 'counter' } })
popRoute('root')
```

- `pushRoute({ stack, name, params })` — `'root'` is a full-screen push
  covering the tab shell on both targets. Web renders named routes in the
  tab outlet. iOS uses a named `Frame` only when one is registered (the
  platform `UITabBar` does this; shared `Tabs` does not). Android named
  stacks always use the router-owned swap-pane: pushes live in the route
  store and render through `RouteHost` inside the pane — including inside
  `BottomNavigationView`, whose Frame panes are kept for chrome only
  (TabViewItem Frames lose bookkeeping upstream, NativeScript#11444).
- `popRoute(stack?)` — native pops the selected registered `Frame` or
  Android route array (quiet no-op at the base). Web is one linear history →
  `history.back()`; the `stack` arg is accepted for parity and ignored.
- `useRoute(stack)` — the current route for a stack, `null` at its base.
  Native reads the registered frame's `currentPage` on iOS and router state on Android;
  web reads the URL store.
- Pushed native screens get `_stack` injected into props on named-stack
  pushes — call `popRoute(props._stack)` / `goBack({ into: props._stack })`
  to pop the stack that pushed you. Web route params are URL-backed.

```tsx
import { useRoute, Text, Pressable } from '@octane-xplat/ui'

export function PushedScreen({ _stack = 'root' }: { _stack?: string }) {
	const route = useRoute(_stack)
	return (
		<Pressable onPress={() => popRoute(_stack)}>
			<Text>{route?.name ?? 'Back'}</Text>
		</Pressable>
	)
}
```

## What must be registered

1. **Screens** — `registerScreens({ name: Component })` once, from the
   shared screens module (`packages/app/src/screens.ts` does it at module
   scope). Native `pushRoute` resolves `route.name` through it; web
   outlets use it when `Tabs` has no `resolveScreen` prop.
2. **`'root'`** — nothing. When the app boots a `Frame` window root (the
   standard `Application.run` shape), `getStack('root')` auto-resolves
   `Application.getRootView()`. `registerStack('root', frame)` remains as
   an override. A non-Frame root can't host pushes — the push warns and
   drops.
3. **Named stacks** — `UITabBar` from `@octane-xplat/ui/ios` registers a
   `Frame` for each stacked tab. The shared `Tabs` does not register Frames;
   Android stores named routes in router-owned arrays and the active pane
   (`Tabs` or `BottomNavigationView`) renders the top entry through
   `RouteHost`.

```tsx
import { registerScreens, Text } from '@octane-xplat/ui'

function Help() {
	return <Text>Pack essentials first.</Text>
}
registerScreens({ help: Help })
```

Invalid targets warn loudly (once per key, dev and release): unregistered
root stack, unknown screen name, or non-Frame root.

## Route shapes — what actually pushes today

| Shape                         | Web                                                                                                                   | iOS                                                        | Android                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `{stack:'root'}` push         | ✓ `/<path>?params` covers shell                                                                                       | ✓ verified                                                 | ✓ verified                                                                                         |
| named stack (`stack:'demos'`) | ✓ `/demos/<path>` in pane                                                                                             | registered `UITabBar` Frame; shared `Tabs` via route store | swap-pane route store, rendered in-pane (shared `Tabs` verified; `BottomNavigationView` desk-only) |
| params                        | `[param]` segments → real path (`/demo/counter`); extras → query-string scalars — objects degrade (`[object Object]`) | real objects as props                                      | real objects as props                                                                              |
| `useRoute`/`routeFor`         | ✓                                                                                                                     | ✓ stamped on pushed page                                   | ✓ root; named tabs subscribe to router state                                                       |
| `popRoute`                    | ✓ (`history.back`)                                                                                                    | ✓                                                          | ✓ root + router-owned named-stack pop                                                              |
| deep link at boot             | ✓ `currentRoute()` seeds tab                                                                                          | n/a                                                        | n/a                                                                                                |

Keep params to scalars for parity — the web leaf serializes into the URL.

```ts
pushRoute({ stack: 'root', name: 'demo/:id', params: { id: 'counter', from: 'home' } })
```

## Screen registry — the `app/` route dir

`packages/app/src/app/` — every `.tsrx`/`.tsx` file is a route, derived by
`import.meta.glob` in platform manifests (`routes.gen.web.ts` excludes
mobile/OS-specific files; `routes.gen.mobile.ts` excludes web/macOS files and
prefers `.ios` or `.android` before `.mobile` via `Device.os`).
`deriveRouteManifest(files, prefer)` → `{screens, routes, layouts}`;
`registerRoutes(manifest)` in `routes.ts` registers both.

```ts
import { deriveRouteManifest, registerRoutes } from '@octane-xplat/ui'

// routes.web.ts — the glob belongs in a Vite app module.
const files = import.meta.glob('./app/**/*.tsrx', { eager: true })
const manifest = deriveRouteManifest(files)
registerRoutes(manifest)
```

- `app/demo/[id].tsrx` → route `demo/:id` — `navigate('demo/:id', {id})`;
  `[param]` → `:param`. `app/foo/index.tsrx` → `foo`.
- `app/_layout.tsrx` → `layouts['']` — the shell the entry renders
  (`export const App = routes.layouts['']` in `index.ts`). Not a route.
- `app/settings.web.tsrx` → web-only route (skipped by the mobile glob).
- Component pick: `default` → `screen` → single function export.
- Params arrive as props (native: pushed root's props; web: path segments
  - query). Route names are `string` — literal typing awaits routes.d.ts
    codegen.

Adding a route = adding a file; no table edits.

```tsx
// app/help.tsrx — code generation derives the help route from this file.
import { Text } from '@octane-xplat/ui'

export default function Help() {
	return <Text>Pack essentials first.</Text>
}
```

## Native model

- Shared `Tabs` renders a fixed tab row and swaps one pane; it does not host
  a Frame. `UITabBar` from the iOS subpath uses NativeScript `TabView` and
  registers a `Frame` for each `TabSpec` with a stack.
- Pushed `Page`s host their own Octane root — never shared context with
  the presenter (decision #9).
- **`Frame.topmost()` is unreliable once nested frames exist** (Android:
  innermost). `getStack('root')` resolves the window root Frame — never
  `topmost()`.
- Android hardware back is framework-owned: `route.native` installs the
  `activityBackPressed` listener when screens or stacks register — no app
  wiring. Ordered pop: newest modal, then the root stack (a pushed page
  covers the shell), then the most recently used named stack, then any
  named stack that can pop. `useBackInterceptor(fn)` /
  `addBackInterceptor(fn)` run most-recent-first before the default pop;
  return true to consume. Web twin is a warned no-op (browser back is URL
  history).
- Frame lifecycle traps + the nested-stack bug: `navigation/native-frames.md`.

```tsx
// EditScreen.mobile.tsx — the hook is called unconditionally in a component.
import { useBackInterceptor, Text } from '@octane-xplat/ui'

export function EditScreen({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) {
	useBackInterceptor(() => hasUnsavedChanges)
	return <Text>Save edits before leaving</Text>
}
```

## Web model

`route.web.ts` — module-scope route store over real history:

```ts
import { pushRoute, popRoute, currentRoute } from '@octane-xplat/ui'

pushRoute({ stack: 'root', name: 'help', params: {} })
console.log(currentRoute())
popRoute()
```

- `pushRoute` → `pushState` — manifest routes write real paths with
  `:param` substitution (`/demos/demo/counter`); params not in the path
  fall back to the query string (`/detail?from=home`). Names outside the
  manifest keep `/<stack>/<name>?params`.
- `popRoute` → `history.back()`; `popstate` resyncs the store.
- `Tabs` is the outlet: `useRoute('root')` covers the shell when a root
  route is active; `useRoute(activeTab.stack)` renders a pushed screen in
  the pane via `resolveScreen` prop — or the `registerScreens` table when
  the prop is absent.
- Deep links work: `currentRoute()` seeds the initial tab index at boot
  (Vite preview SPA-fallbacks unknown paths to index.html).

## Hook rules in outlets

`useRoute(stack)` calls must be unconditional — subscribe with
`props.tabs[active]?.stack ?? ''` rather than conditionally (conditional
hook calls break the compiler's slotting).

```tsx
import { useRoute, Text } from '@octane-xplat/ui'

export function Destination({ stack }: { stack?: string }) {
	const route = useRoute(stack ?? '')
	return <Text>{route?.name ?? 'Base screen'}</Text>
}
```

## Modal routes and modal primitives

Route files may use `+modal` or `pushRoute({ presentation: 'modal', ... })`.
Native presents a separate root and web overlays the previous history entry.
These routes pass data as props because context does not cross roots.

```ts
pushRoute({ stack: 'root', name: 'help', presentation: 'modal', params: { topic: 'packing' } })
```

The shared `BottomSheet`, `Overlay`, `Popover`, and `openBottomSheet(Component, props)`
APIs remain separate from route navigation; use them for transient UI without
a shareable destination. For OS-authentic modal widgets, import
`UIModal`/`MaterialDialog` from the matching UI subpath. See `overlays.md`.

```tsx
import { useState } from 'octane'
import { BottomSheet, Text } from '@octane-xplat/ui'

export function TemporaryDetails() {
	const [isOpen, setOpen] = useState(false)
	return (
		<BottomSheet label="Bag details" isOpen={isOpen} onOpenChange={setOpen}>
			<Text>Bag details</Text>
		</BottomSheet>
	)
}
```
