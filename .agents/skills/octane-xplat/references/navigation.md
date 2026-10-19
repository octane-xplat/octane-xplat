# Navigation

The framework owns the API; each platform provides the mechanism.
`pushRoute`/`popRoute`/`useRoute` are real on **both** targets — web is a
URL store over history; native root routes use `Frame`/`Page` stacks. The
shared `Tabs` is a self-drawn row and one swapped pane. Platform-authentic
`UITabBar`/`BottomNavigationView` components live in the native subpaths.

```ts
import { pushRoute, popRoute } from '@octane-xplat/ui/routing'
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
  pushes — call `popRoute(props._stack)`
  to pop the stack that pushed you. Web route params are URL-backed.

Native Pages and route modals preserve the providers around a mounted
`RouteOutlet` for their stack. Keep that outlet in the long-lived shell;
removing it releases owned Pages and pending loads. The handler's location
alone does not capture a screen-local provider. Without an outlet, routing
uses a standalone root and needs params or a subscribed store.

```tsx
import { RouteOutlet, Screen, Text } from '@octane-xplat/ui'

export function AppShell() {
	return (
		<Screen>
			<RouteOutlet stack="root">
				<Text>Home</Text>
			</RouteOutlet>
		</Screen>
	)
}
```

Wrap this shell in the app's providers; v0.16.0 provider callables have a
[shared-facade typing limitation](../../../docs/notes/styled-jsx-contract.md#context-providers).
For screen-local ownership, use the scoped NativeScript navigator described in
[the route provider guide](../../../../docs/app/navigation.md#preserve-providers-across-native-pages).

```tsx
import { Text, Pressable } from '@octane-xplat/ui'
import { useRoute, popRoute } from '@octane-xplat/ui/routing'

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
import { Text } from '@octane-xplat/ui'
import { registerScreens } from '@octane-xplat/ui/routing'

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
import { pushRoute } from '@octane-xplat/ui/routing'

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
import { deriveRouteManifest, registerRoutes } from '@octane-xplat/ui/routing'

// routes.web.ts — the glob belongs in a Vite app module.
const files = import.meta.glob('./app/**/*.tsrx', { eager: true })
const manifest = deriveRouteManifest(files, ['web'])
registerRoutes(manifest)
```

- `app/demo/[id].tsrx` → route `demo/:id`;
  `[param]` → `:param`. `app/foo/index.tsrx` → `foo`.
- `app/_layout.tsrx` → `layouts['']` — the shell the entry renders
  (`export const App = routes.layouts['']` in `index.ts`). Not a route.
- `app/settings.web.tsrx` → web-only route (skipped by the mobile glob).
- Component pick: `default` → `screen` → single function export —
  `ErrorBoundary` is reserved (never the screen).
- Params arrive as screen props (native objects; browser path/query values).
  Generated route types register on `AppRoutes`, so names and params are checked
  at `pushRoute`/`NavLink` callsites once the app schema is registered.
- A route may export `loader(params)` — pushed commits await it; the screen
  mounts holding `data` or `error`. Direct-URL/history hydration mounts the
  screen first with `pending: true`, then lands the result.
- A route may export `ErrorBoundary` — render error boundary with props
  `{ error, reset, route }` (`RouteErrorBoundaryProps`). It wraps the
  layout+screen subtree at every outlet (pushed page, native modal root,
  named stack root, web root/pane/modal). `reset` remounts the same subtree
  without rerunning `loader`/`beforeLoad`; re-push to retry route data.
  Loader rejections never enter it — they stay on the screen's `error` prop.

```tsx
// app/detail.tsrx — a route file's render boundary.
import { Text, type RouteErrorBoundaryProps } from '@octane-xplat/ui'

export function ErrorBoundary(props: RouteErrorBoundaryProps) {
	return <Text>{`Route failed: ${String(props.error)}`}</Text>
}
```

Adding a route = adding a file; no table edits.

```tsx
// app/help.tsrx — code generation derives the help route from this file.
import { Text } from '@octane-xplat/ui'

export default function Help() {
	return <Text>Pack essentials first.</Text>
}
```

## Generate or define typed routes

For app file routes, regenerate entries and declarations with `xplat routes`.
The CLI also runs generation during dev, build, and typecheck; do not hand-edit
its generated files.

```sh
pnpm exec xplat routes
```

For a package or programmatic route set, use `defineRoutes` and register its
inferred params on `AppRoutes`. Without a schema contribution, names remain
open strings. Keep each route source under its own augmentation member.

```tsx
import { Text } from '@octane-xplat/ui'
import {
	defineRoutes,
	registerRoutes,
	pushRoute,
	type ManifestRouteParams,
} from '@octane-xplat/ui/routing'

function Guide(props: { slug: string }) {
	return <Text>{props.slug}</Text>
}
const manifest = defineRoutes({ routes: [{ path: 'docs/:slug', screen: Guide }] })
declare module '@octane-xplat/ui' {
	interface AppRoutes {
		guides: ManifestRouteParams<typeof manifest>
	}
}
registerRoutes(manifest)
pushRoute({ stack: 'root', name: 'docs/:slug', params: { slug: 'packing' } })
```

Read [the navigation guide](../../../../docs/app/navigation.md) for guards,
loaders, redirects, baked data, deep links, and schema composition. Use its
current contracts rather than inferring them from a harness route manifest.

## Native model

- Shared `Tabs` renders a fixed tab row and swaps one pane; it does not host
  a Frame. `UITabBar` from the iOS subpath uses NativeScript `TabView` and
  registers a `Frame` for each `TabSpec` with a stack.
- Pushed Pages stay in the mounted route outlet's tree. A Page in the
  backstack retains local state and receives provider updates; popping it
  releases its portal. Ownerless navigation retains the standalone-root fallback.
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
import { Text } from '@octane-xplat/ui'
import { useBackInterceptor } from '@octane-xplat/ui/routing'

export function EditScreen({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) {
	useBackInterceptor(() => hasUnsavedChanges)
	return <Text>Save edits before leaving</Text>
}
```

## Web model

`route.web.ts` — module-scope route store over real history:

```ts
import { pushRoute, popRoute, currentRoute } from '@octane-xplat/ui/routing'

pushRoute({ stack: 'root', name: 'help', params: {} })
console.log(currentRoute())
popRoute()
```

- `pushRoute` → `pushState` — manifest routes write real paths with
  `:param` substitution (`/demos/demo/counter`); params not in the path
  fall back to the query string (`/detail?from=home`). Names outside the
  manifest keep `/<stack>/<name>?params`.
- `popRoute` → `history.back()`; `popstate` resyncs the store (the listener
  is a window-slot singleton — re-imports under HMR/test resets do not
  duplicate it).
- `Tabs` is the outlet: `useRoute('root')` covers the shell when a root
  route is active; `useRoute(activeTab.stack)` renders a pushed screen in
  the pane via `resolveScreen` prop — or the `registerScreens` table when
  the prop is absent.
- Scroll: positions save per history entry — a push starts at top or at
  `route.hash`'s element, pop/forward restores the saved position, and a
  modal push leaves the position beneath it alone. `route.hash` writes the
  `#fragment` into the URL; native ignores the field and retains scroll by
  keeping pushed subtrees alive.
- Deep links work: `currentRoute()` seeds the initial tab index at boot
  (Vite preview SPA-fallbacks unknown paths to index.html).

## Hook rules in outlets

`useRoute(stack)` calls must be unconditional — subscribe with
`props.tabs[active]?.stack ?? ''` rather than conditionally (conditional
hook calls break the compiler's slotting).

```tsx
import { Text } from '@octane-xplat/ui'
import { useRoute } from '@octane-xplat/ui/routing'

export function Destination({ stack }: { stack?: string }) {
	const route = useRoute(stack ?? '')
	return <Text>{route?.name ?? 'Base screen'}</Text>
}
```

## Modal routes and modal primitives

Route files may use `+modal` or `pushRoute({ presentation: 'modal', ... })`.
Native presents a separate host whose content belongs to the mounted route
outlet, when present. Web overlays the previous history entry. Use params for
destination data; provider inheritance follows the outlet ownership above.

```ts
import { pushRoute } from '@octane-xplat/ui/routing'

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
