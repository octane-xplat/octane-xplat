# Navigation ownership and retained UI

Use for rendering-flow navigation, unsaved edits, panes, retained roots, and lifecycle boundaries. [Route authoring](authoring.md) supplies the generated catalog and typed navigation setup.

## Navigate from the rendering flow

Use `useRouter()` in a routed tree and the imported `router` for root-level
imperative actions. `useCanGoBack()` and `useRouterState()` are reactive and
owner-bound; they take no legacy stack string. A hidden retained entry keeps
its own match when reading through `getRouteApi`.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import { useCanGoBack, useRouter } from '@octane-xplat/ui/routing'
export function Back() {
	const navigation = useRouter()
	const available = useCanGoBack()
	return <Pressable disabled={!available} onPress={() => navigation.back()}><Text>Back</Text></Pressable>
}
```

Use `push`, `replace`, `reset`, `back`, `dismiss`, `refresh`, and `retry` for
their distinct operations. Native modal Back walks the presentation's inner
history and returns `at-base` at its first screen; dismiss closes the surface.
Browser reset cannot erase history and returns `unsupported`.

```ts
import { router } from '@octane-xplat/ui/routing'
const result = await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
if (result.status === 'committed') await result.finished
```

## Confirm unsaved navigation

Use the entry-owned blocker for a draft, including under a custom provider. It
asks before context/guards/loaders; stale controls cannot approve a newer attempt.
Refresh bypasses leave confirmation. Clearing the condition or unmounting a
blocked declaration cancels it; proceed ends with navigation, not animation.

```tsx
import { Button, View } from '@octane-xplat/ui'
import { useNavigationBlocker } from '@octane-xplat/ui/routing'
export function ConfirmLeave(props: { dirty: boolean }) {
	const blocker = useNavigationBlocker({ when: props.dirty })
	return blocker.status === 'blocked' ? <View>
		<Button label="Keep editing" clickAction={blocker.reset} />
		<Button label="Leave screen" clickAction={blocker.proceed} />
	</View> : null
}
```

Older retained entries in the same flow cannot block its current entry. Several
active blockers must all approve, newest registration first. Confirmation is
flow-owned; redirects stay in the approved attempt, and parent-owner teardown
or raw host closure cannot be vetoed. This does not intercept document unload
or OS exit. See the [supported boundaries and save ordering](../../../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits)
before adding app-wide exit protection.

## Keep panes and ownership explicit

A named stack has a distinct URL marker: `/@library/items/coat`. Generate links
with the bound navigator's `href`; ordinary root patterns and catch-alls cannot
claim a marked stack URL. Literal `@` route segments are percent-encoded. Use
three slashes for a custom-scheme link such as `pack:///@library/items/coat`,
so the stack marker is in the path, not the URL authority.

```ts
import { router } from '@octane-xplat/ui/routing'
const href = router.forStack('library').href({ to: '/items/:id', params: { id: 'coat' } })
```

A named `Tabs` pane owns its route outlet. Stackless tabs are ordinary UI.
Retain tab render functions and keys; place the outer root outlet explicitly.
Native activity Back targets the visible flow rather than stealing hidden-tab
history. Native pane histories are independent; web still has one browser history.

```tsx
import { RouteOutlet, Tabs, Text } from '@octane-xplat/ui'
function Library() { return <Text>Library</Text> }
function Settings() { return <Text>Settings</Text> }
const tabs = [
	{ key: 'library', title: 'Library', stack: 'library', render: Library },
	{ key: 'settings', title: 'Settings', stack: 'settings', render: Settings },
]
export function Sections() { return <RouteOutlet><Tabs tabs={tabs} /></RouteOutlet> }
```

A root outlet owns retained prepared route data. On web, removing it discards
current/saved matches and owned Back state; a new default root prepares the
current URL again without adding history. Application stores are separate.
Key a common component around every outlet that should be discarded together.
A new native owner waits for old Frame restoration and modal cleanup before
committing navigation; it starts at its declaring content. A context-source
update alone does not invalidate retained prepared entries.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'
function OwnedScreens() { return <RouteOutlet><Text>Choose a screen.</Text></RouteOutlet> }
export function App(props: { ownershipVersion: number }) {
	return <OwnedScreens key={props.ownershipVersion} />
}
```

Embedded panes use an explicit instance with `createPaneRouterHost` and
`RouterPane`. Attach the instance created with that host before rendering;
cloned bindings, host reuse and attachment to another instance are rejected.
The creator owns disposal. Keep JSX component declarations at module scope for
universal compilation; factories create controller/state objects. Pane histories
retain screens and providers without changing browser URLs, creating native
Frames or presenting modals. Motion reports skipped. OS Back and window-close
integration belong to the enclosing host. Typed hooks take the explicit instance.
The experimental native GTK renderer supports this explicit pane workflow through
`xplatLinuxGtk`. Keep its screens in `.gtk` leaves and use the GTK preset's
renderer resolution. Its modal presentation, OS Back, generated startup and
full shared-control support are outside this measured subset. See the
[GTK pane example](../../../../../docs/platform/linux-gtk.md#add-retained-route-panes)
and [executed checks](../../../../docs/navigation-checks.md#native-gtk-retained-panes).

Read the [complete pane walkthrough](../../../../../docs/app/navigation.md#bind-a-custom-router-to-rendering)
for toolbars, named flows and lifetime cleanup.

```tsx
import { Text } from '@octane-xplat/ui'
import { createPaneRouterHost, createRouter, defineRoute, defineRoutes, RouterPane } from '@octane-xplat/ui/routing'
export function createPaneNavigation() {
	const host = createPaneRouterHost()
	const catalog = defineRoutes([defineRoute({ path: '/help' }).screen(() => null)])
	const navigation = createRouter({ catalog, host: host.host, stacks: ['library', 'settings'] })
	host.attach(navigation)
	return { host, navigation, dispose: () => navigation.dispose() }
}
export function Library(props: { workspace: ReturnType<typeof createPaneNavigation> }) {
	return <RouterPane host={props.workspace.host} router={props.workspace.navigation} stack="library">
		<Text>Library base</Text>
	</RouterPane>
}
```

Register runtime contributions with stable IDs and disposal handles. They do
not widen compile-time destinations or replace a declared contract, even with
`conflict: 'replace'`; compose declared overrides before creating the instance.
Keep reusable specs literal with `as const satisfies RouteSpec`; a broad
`: RouteSpec` annotation erases the finite path. Ordinary catalog errors put
the literal-path repair first. The baked-data signature requires actual data;
explicit generic arguments cannot provide evidence for an omitted value.

```ts
import { defineRoutes, type RouteSpec } from '@octane-xplat/ui/routing/core'
const help = { path: '/help', screen: () => null } as const satisfies RouteSpec
const helpRoutes = defineRoutes([help])
```

Use `defineRoutes` for finite patterns and `defineRuntimeRoutes` for computed
strings/templates. Both preserve root dependencies. Prefer `/guides/:slug` for
content sharing one screen. Returned catalogs/definitions are immutable;
author changes through the builders instead of spreading inferred definitions
or editing metadata.

```ts
import { defineRoute, defineRuntimeRoutes } from '@octane-xplat/ui/routing/core'
import type { RouterInstance } from '@octane-xplat/ui/routing'
export function installContent(navigation: RouterInstance, paths: readonly string[]) {
	const catalog = defineRuntimeRoutes(paths.map(path => defineRoute({ path }).screen(() => null)))
	return navigation.addRoutes(catalog, { id: 'content', conflict: 'replace' })
}
```

Aggregate state, navigation results, and `useRouteMatch` include a runtime
branch with unknown data. Check `contract === 'declared'` before narrowing the
declared route union. Use a named accessor for the
inferred DTO. Under a custom provider, pass its instance to typed hooks and
accessors; omitted instances refer to the default client and throw under a
custom provider. Client behavior belongs in definitions, never router option
overrides.

```tsx
import { useRouter } from '@octane-xplat/ui/routing'
import { Pressable, Text } from '@octane-xplat/ui'
import type { createPaneNavigation } from './pane-navigation'
type Navigation = ReturnType<typeof createPaneNavigation>['navigation']
export function OpenHelp(props: { navigation: Navigation }) {
	const navigation = useRouter(props.navigation)
	return <Pressable onPress={() => navigation.push({ to: '/help' })}><Text>Help</Text></Pressable>
}
```

## Boundaries to preserve

Route presentation and motion are separate. Use `transition: 'none'` for
predictable no-animation navigation. Browser `fade`/`default` wrap the actual
DOM commit in View Transitions after preparation. Navigation resolves at commit;
`result.finished` reports animation separately. Reduced motion and missing
browser support skip the effect. Register custom names with `defineTransitions`
and browser leaves with `defineWebTransition` from `@octane-xplat/ui/web`; configure
the export in `xplat.routes.json`. Other target leaves need the same keys and an
implementation or explicit `{ kind: 'skip' }` fallback. Native Frame leaves use
`defineNativeTransition` from `@octane-xplat/ui/nativescript` with a synchronous
`page` factory returning NativeScript navigation options or a new Transition
instance. The native engine owns Back reversal; do not rerun that factory for
Back. The same definition's `view` option animates routed NativeScript modals
and retained rendered panes: the router-owned content wrapper animates from the
flat `from` values (`opacity`, `translateX/Y`, `scaleX/Y`, `rotate`) to neutral
via the SDK `Animation` engine after the surface appears (`animated: false` —
`ShowModalOptions.transition` is unreliable upstream). Built-in `fade` fades
content for 240 ms; the `view` subset is unsupported on GTK and Windows, which
report `skipped`/`unsupported`.
AppKit pane leaves use `defineAppKitTransition` from `@octane-xplat/ui/macos`:
`from` supplies the same flat numeric starting values, optionally derived from
direction, and `duration` is a linear tween in milliseconds. The router restores
its private incoming wrapper to neutral values on completion/interruption/
disposal; routed AppKit modal content animates the same way after `show`. Back
uses the departing definition with reverse direction. No outgoing snapshots are
implied.

```ts
// src/transitions.macos.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineAppKitTransition } from '@octane-xplat/ui/macos'
export const transitions = defineTransitions({
	detail: defineAppKitTransition({
		from: ({ direction }) => ({ opacity: 0, translateX: direction === 'back' ? -24 : 24 }),
		duration: 240,
	}),
})
```

Explicit router instances infer their own transition keys through hooks and
NavLink. AppKit routed modals use a deferred fullscreen in-window surface,
retain their own history/providers, and animate content with a configured
`defineAppKitTransition` (otherwise `finished` reports `skipped`). Back at
the first modal screen returns `at-base`; `dismiss` closes the flow.
Escape/outside callbacks request canonical guarded dismissal; raw window closure
and owner removal clean up the modal family. Native keyboard/pointer input
requires separate target qualification.

```ts
import { router } from '@octane-xplat/ui/routing'
await router.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal', transition: 'none' })
```

Browser routed modal flows use body portals and the shared modal focus manager:
the presenter is inert, Tab stays inside, and Escape requests canonical guarded
dismissal. `head.title` names the dialog (fallback: “Dialog”). Focus ownership
survives screen changes. A stable DOM `id` can restore the opener after presenter
revalidation replaces its node. A remaining parent modal is the fallback for a
removed opener; do not claim an absent control is recreated or that screen-reader
input has been tested.

```tsx
export const head = () => ({ title: 'Edit item' })
```

Browser page changes focus an explicit autofocus target, then a visible h1/
level-one ARIA heading, a main landmark or the document body. Temporary tabindex
is released on blur/owner teardown. Route focus is scripted, not user input, so
it never paints a focus ring (`focusVisible: false` plus a
`data-xplat-programmatic-focus` marker while the hold lasts); keyboard
`:focus-visible` rings are unaffected. Back/Forward use entry-specific document
scroll and saved focus, with stable DOM IDs for re-rendered controls. Refresh
preserves focus/scroll; ordinary push/replace/search updates use page-change
effects. Cancelled/stale work cannot apply late focus, scroll or head metadata.
These are document effects; nested scrollers, late layout shifts, native focus
and assistive-technology input require their own qualification.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export default function Help() {
	return <main><h1>Packing help</h1><button id="packing-action">Pack</button></main>
}
```

The default client is app/document-local. Server hosts must create request-local
instances, context and preparation state; a JSON manifest is not an SSR host.
Do not configure a shared default client for an account on a server request.

```ts
// Client entry only:
import './routes.gen'
// Optional server HTML uses @octane-xplat/web-host/server, not this startup.
```

```ts
// src/transitions.mobile.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'
export const transitions = defineTransitions({
	detail: defineNativeTransition({ page: () => ({ name: 'slideLeft', duration: 240 }) }),
})
```

Read [the app navigation guide](../../../../../docs/app/navigation.md) for complete
workflows, [Frame internals](native-frames.md) only when debugging
native containment, and [navigation checks](../../../../docs/navigation-checks.md)
for commands and target-specific evidence. Current cutover verification must be
reported separately from historical pre-cutover runs; Windows has no VM here.

Incoming absolute links require explicit `allowedSchemes` or `allowedOrigins`
in `xplat.routes.json` (or explicit router configuration). Schemes map their
authority into the route path; HTTPS origins are allowlisted and removed before
matching. For example, `pack://items/coat` and an allowed
`https://app.example/items/coat` both resolve `/items/:id`. Unconfigured URLs
return `invalid-input`; malformed links never create fallback routes.

```json
{ "allowedSchemes": ["pack"], "allowedOrigins": ["https://app.example"] }
```
