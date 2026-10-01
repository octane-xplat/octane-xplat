# Moving between screens

> Give every destination a name and let the same screen map to a browser URL
> or a native navigation stack.

Start with the journey: open a record, inspect its detail, and return
without losing your place. Ask your agent to verify the browser URL and the
native back action for that flow. Shared destinations can use different
platform shells; check [navigation limits](known-limits.md#navigation) for the
targets you need.

## A route is a destination

Routes have three pieces:

```ts
pushRoute({
	stack: 'root',
	name: 'settings',
	params: {},
})
```

The `name` identifies the screen. `params` carries the small amount of data
needed to open it. `stack` is `root` for the main flow or a named stack such
as a tab's inner navigation.

On the web, the route becomes a real URL, so refresh, back, bookmarks, and
shared links keep working. On native, the same route pushes a screen into the
matching navigation stack.

## Let the route dir name your routes

Files under `app/` become routes automatically — the file path is the name:

```
app/detail.tsrx        → 'detail'
app/demo/[id].tsrx     → 'demo/:id'
app/settings.web.tsrx  → 'settings'      (web only — suffixes still apply)
app/about+modal.tsrx   → 'about'         (modal presentation)
app/notes.md           → 'notes'         (markdown — baked at codegen)
app/chat/_layout.tsrx  → wraps every 'chat/*' route
app/x.loader.ts        → build-time loader for baked route 'x' (never bundles)
```

Route params land as screen props. Feed them to a
[screen-owned query](data.md#module-scope-vs-screen-scope) when stacked
screens must keep independent requests.

`deriveRouteManifest` turns the glob into the table and `registerRoutes`
registers it once at boot — there is no per-screen wiring to maintain.
`xplat routes` (run automatically by `xplat dev`, `xplat build`, and
`xplat typecheck`) emits `routes.gen.types.ts`, `routes.gen.data.ts`,
`routes.gen.manifest.json`, and one platform twin per target
(`routes.gen.web.ts`, `.mobile.ts`, `.macos.ts`, `.windows.ts`) — the
typed names, baked loader results, the normalized host schema, and the
platform globs + registration all live in generated code; `routes.ts`
just re-exports. The generated `RouteName` and `RouteParams` types
describe every route name and its param shape, so a typed wrapper around
`pushRoute`/`Link` can name-check destinations.

## Register routes from data

The file tree can't express routes derived from runtime data — a docs app
that maps a content directory, or a host framework generating its route
table. `defineRoutes` builds the same manifest from specs instead of files
(decision #67):

This composition fragment assumes `docs` is your data array and `GuideIndex`,
`GuideShell`, and `guideScreen(doc)` are your components. The maintained
[guide routes](../packages/app/src/guides.tsrx) show the complete example.

```ts
import { addRoutes, defineRoutes } from '@octane-xplat/ui'

addRoutes(
	defineRoutes({
		routes: [
			{ path: 'guides', screen: GuideIndex, head: { title: 'Guides' } },
			...docs.map((doc) => ({
				path: `guides/${doc.slug}`,
				screen: guideScreen(doc), // a component closing over the record
				head: { title: doc.title },
			})),
		],
		layouts: { guides: GuideShell }, // like guides/_layout.tsrx
	}),
)
```

A `RouteSpec.path` uses the route-dir vocabulary — `'docs/:slug'` (or
`'docs/[slug]'`) declares a param, a trailing `index` or `''` names the
root, and `presentation` replaces the `+modal`/`+fade` suffix. `screen` is
the component itself, not a module; `loader`, `beforeLoad`, and `head` work
exactly like the route-file exports. `layouts` keys are path prefixes that
wrap every route beneath them, the same job `_layout.tsrx` does.

Registered routes are indistinguishable from file routes — they push into
named stacks, resolve through `screenFor` outlets, match deep links, and
substitute params into web URLs. `addRoutes` layers its manifest over the
file-derived one at any point (it survives `routes.gen` re-registration
under HMR); to compose before registration instead, pass
`registerRoutes(mergeRouteManifests(routes, dynamic))`.

**Precedence is registration order.** On a same-name collision the later
manifest wins and a console warning names both sources — deliberate
overrides layer on top, accidental ones are loud. Merge the dynamic
manifest first (`mergeRouteManifests(dynamic, routes)`) if file routes
should win.

Literal paths are typed at the callsite — `defineRoutes` infers route
names, params, and presentations from each `path` string, and the returned
manifest carries them through `ManifestRouteNames`/`ManifestRouteParams`/
`ManifestRoutePresentations`, so an app can union them into its generated
types (`RouteName | ManifestRouteNames<typeof manifest>`) with no codegen
step. Only paths that are genuinely computed at runtime stay outside the
typed surface — navigate those with the low-level `Route` shape
(`pushRoute({stack, name, params})`, `NavLink route={...}`). The generated
`routes.screens` snapshot likewise covers file routes only — resolve
screens through `screenFor(name)`, which reads the merged registry.

## Present a route modally

Suffix the file with `+modal`, or pass `presentation: 'modal'` on the push.
Native shows it as its own modal root over the current page; web overlays it
while keeping the URL underneath. Back — or the `close` prop the screen
receives — dismisses it. `+fade` pushes with a fade transition. A modal
screen mounts its own root, so component context does not reach it — pass
values through params or a shared store.

A route file can also export `loader(params)` — it runs when the route is
pushed, before the screen commits. Its awaited result lands on the screen as
a `data` prop; a rejected loader lands as `error`. That's the default
`dataMode: 'live'`; the next section covers baking the result in instead.

## Bake route data at build time

`export const dataMode = 'baked'` moves the loader off the runtime: its
output is computed once during `xplat routes`/`dev`/`build`, serialized
into `routes.gen.data.ts`, and delivered to the screen as `data` on web and
native without a navigation-time fetch.

The loader itself moves to a sibling module — `app/changelog.tsrx` pairs
with `app/changelog.loader.ts` exporting `loader()`. That module runs under
Node (vite `ssrLoadModule`), so `node:fs` and friends are legal inside it,
and because nothing at runtime imports it, its dependency graph stays out
of every bundle. An in-file `loader` export on a baked route warns and is
ignored — it would drag its imports into the shipped graph.

Constraints that keep the mechanism honest:

- **JSON results.** A non-serializable value (function, symbol, bigint)
  fails `xplat routes` naming the route.
- **No params at bake.** The loader runs once per route, not per URL — a
  `docs/[slug]` baked loader returns the whole slug→record table and the
  screen selects by `params.slug`.
- **Regeneration is explicit.** Baked data is committed like the manifest;
  edit a `.loader.ts` and re-run `xplat routes` (or dev/build). `Xplat
typecheck` refreshes types without re-baking.
- A `dataMode: 'baked'` route with no `.loader.*` sibling fails codegen —
  the pairing is checked, not implied.

Programmatic routes carry the same axis: `dataMode: 'baked'` on a
`RouteSpec` plus a `baked` map on the `defineRoutes` set — the host
computes the data however it wants and ships it in the manifest.

## Route a markdown file

A `.md` file in the route dir is a baked route with the parser built in:
`xplat routes` converts it to a JSON AST at codegen, the result rides
`bakedRouteData` like any baked route, and the shared `MarkdownScreen`
renders it through the vocabulary (`Text`/`View`) on every target — no
parser ships. It's the zero-code path for help, changelog, and docs
screens. A `[param].md` warns and is skipped (use the `.loader.ts` table
pattern for param'd content); a `.md` file colliding with a same-name
component file keeps the component with a warn.

`MarkdownScreen` handles the `Screen`/`ScrollView` shell; `Markdown`
renders a document tree anywhere if you embed a baked doc inside a custom
screen.

## Hand the route list to a host

`xplat routes` writes `routes.gen.manifest.json` — a versioned normalized
route list (names, colon paths, params, presentation, `dataMode`, layout
chains, sources, hook-presence flags) that an external host can consume
without reading the route dir. `manifestToJson(manifest)` produces the
identical shape in-process for programmatic or merged manifests, so a host
sees one schema whether routes came from files or `defineRoutes`.

When pushes overlap, the latest request wins for that stack on native and
macOS. Web has one history, so any newer push supersedes the pending push.
For example, push a slow-loading detail screen, then a settings screen:
finishing the detail loader cannot take you away from settings. Back navigation
also invalidates pending work for the affected history. Superseded guards,
redirects, and loader results are ignored; their underlying requests are not
aborted, so loaders must still manage their own side effects.

## Guard and document a route

Route files can export behavior alongside their screen. This fragment assumes
the app supplies `context.user` and registers a `login` destination; Xplat
does not populate authentication context automatically:

```ts
import { redirect } from '@octane-xplat/ui'

export async function beforeLoad({ params, context }) {
	if (!context.user) {
		redirect({ stack: 'root', name: 'login', params: {} })
	}

	return { accountId: params.id }
}

export const head = (params) => ({
	title: `Account ${params.id}`,
	meta: { description: 'Account details' },
})
```

`beforeLoad` is awaited before a `pushRoute` or `NavLink` commits. Its
returned object merges into the route's `context`, `useRoute()` value, and
screen props. Use the exported
`redirect(route)` helper to short-circuit the attempted destination; the
target guard still runs. Web commits the redirect through history; native
commits it through the target `Frame.navigate` path rather than recursively
calling the public `pushRoute` API. A rejected guard logs and leaves the
current destination unchanged.

`NavLink` therefore runs guards on both platforms. `Link`, plain browser
anchors, refresh, and browser back/forward are URL navigation that does not
pass through `pushRoute`; apps that need a boot-time policy should apply it
in their deep-link/bootstrap layer.

`head` is either a static object or a synchronous function of route params.
Web sets `document.title` and creates `meta[name]` tags. Native applies the
title to a pushed `Page`'s action bar; meta entries are inert there. Native
modal roots do not expose a `Page` action-bar surface, so modal meta is inert
on native.

Screens can use `useCanGoBack(stack?)` to render a back affordance. The
framework also supplies `_pushed` on route screen props (and `_stack` for
named native stacks) for code that needs a prop-level seam. On web this is
based on in-app history depth, not the browser's unrelated history entries.

Android hardware back is framework-owned — nothing to wire. Once screens or
stacks register, the press dismisses the newest open modal, then pops the
root stack when a pushed page covers the shell, then the most recently used
named stack; at the base of everything the press falls through to the
system. Apps that need first dibs (close a drawer, confirm a discard) call
`useBackInterceptor(fn)` inside a screen or `addBackInterceptor(fn)` at
module scope — interceptors run most-recent-first and returning `true`
consumes the press before the stack pop. On web there is nothing to
intercept: browser back is URL history, so `addBackInterceptor` is a no-op
that warns once.

Web history is one linear stack. `popRoute(stack)` accepts `stack` for API
symmetry but always pops the browser's current entry; it cannot remove a
non-top named-stack entry without rewriting browser history. Prepared guard context
and loader results are retained during back/forward traversal within the same
document, including modal entries. Calling `addRoutes` does not discard this
prepared state. A fresh document parses its URL again; it does not restore
non-URL screen state or re-run `beforeLoad` automatically. Direct URLs run
the route loader without adding a history entry, including the generated
loader for baked data and Markdown.

Generated `RouteParams` keeps normal route APIs scalar (`string`) for stable
URLs. The low-level `Route` type remains open for compatibility: if an object
or array is passed directly, web JSON-encodes it with a warning and decodes it
again on matching. Prefer the generated scalar API for shareable routes.

## Handle incoming links

`pushDeepLink(url)` turns an incoming URL — `https://…` or an app scheme like
`textcoral://post/5` — into the same route a link would have navigated to.
Register routes before dispatching incoming links. On native, subscribe before
`Application.run` so launch events are captured, but consume the launch URL only
after the navigation host loads. This bootstrap fragment queues links until
NativeScript reports its first displayed frame:

```ts
import { Application } from '@nativescript/core'
import { pushDeepLink } from '@octane-xplat/ui'
import { onDeepLink, consumeInitialUrl } from '@octane-xplat/platform'

let ready = false
const pending: string[] = []
const unsubscribe = onDeepLink((url) => {
	if (ready) pushDeepLink(url)
	else pending.push(url)
})
Application.on(Application.displayedEvent, () => {
	if (ready) return
	ready = true
	const boot = consumeInitialUrl()
	if (boot) pushDeepLink(boot)
	for (const url of pending.splice(0)) pushDeepLink(url)
})
// Then Application.run({ create: ... }) with your Frame-root shell.
```

Keep `unsubscribe` for teardown. The maintained harness wiring in
`packages/app/src/route-links.mobile.ts` waits for a loaded root Page instead.
Browser boot is already URL-driven: do not push its initial URL again.
A URL carried by the native launch event belongs to `consumeInitialUrl`;
other URL events go to the listener. Queue both paths while the host loads,
since iOS may deliver its cold URL through `openUrl`.
Android deduplicates a new-intent/resume pair by intent identity. A later intent
with the same URL is a new navigation request.

### Register a custom scheme

For a scheme named `xplatnav`, add this activity filter to
`App_Resources/Android/src/main/AndroidManifest.xml`, inside the app's
`com.tns.NativeScriptActivity` (use `android:launchMode="singleTask"`):

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="xplatnav" />
</intent-filter>
```

Add this entry inside the root dictionary of `App_Resources/iOS/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array><dict>
  <key>CFBundleURLSchemes</key>
  <array><string>xplatnav</string></array>
</dict></array>
```

Rebuild and install after changing either file. This registers a custom scheme;
HTTPS Universal Links/App Links also need domain association and are outside
this recipe.

### Reproduce launch and fallback behavior

Use a route named `nav/:id`. The isolated release harness registers it and
uses app ID `org.nativescript.xplat.navigation`. With that app stopped, opening
the first URL below is a cold launch. Keep it running for the second request;
send the warm request twice and verify two pushes, one per OS delivery.
Replace `DEVICE_ID` with the selected simulator UUID or Android serial:

```sh
xcrun simctl openurl DEVICE_ID 'xplatnav://nav/cold'
xcrun simctl openurl DEVICE_ID 'xplatnav://nav/warm'
adb -s DEVICE_ID shell am start -W -a android.intent.action.VIEW \
  -d 'xplatnav://nav/cold' \
  -n org.nativescript.xplat.navigation/com.tns.NativeScriptActivity
adb -s DEVICE_ID shell am start -W -a android.intent.action.VIEW \
  -d 'xplatnav://nav/warm' \
  -n org.nativescript.xplat.navigation/com.tns.NativeScriptActivity
```

Also send `xplatnav://missing` and `xplatnav://nav/%` using the same command.
`pushDeepLink` rejects an unregistered screen or malformed percent encoding,
returns `false`, and warns; the current screen stays. Show an app-owned not-found
message when it returns `false`. A `true` result means a match was dispatched,
not that an asynchronous guard or navigation completed. On browser direct load,
a malformed encoded path falls back to the shell; an unmatched literal route
is left to the outlet's not-found UI. Guards are not a blanket filter for
browser bootstrap or history traversal.

The [release navigation checks](navigation-checks.md) exercise these commands
without images. Coverage in this guide and actual per-target results are
recorded separately; scheme registration alone is not runtime verification.

## Keep browser links real

Use `NavLink` for an in-app destination the user might copy or open in a new
tab — on web it renders a real `<a href>` whose plain click drives
`pushRoute` while modified clicks keep native browser behavior; on native it
navigates the same route. Use `Link` for an outbound URL — a real anchor on
web, the OS opener on native. Use `pushRoute` for an in-app action that is
not naturally a link.

```tsx
import { HStack, Link, NavLink } from '@octane-xplat/ui'

export function Footer() {
	return (
		<HStack>
			<NavLink route={{ stack: 'root', name: 'settings', params: {} }}>Settings</NavLink>
			<Link href="https://example.com">Website</Link>
		</HStack>
	)
}
```

For a component that must observe the current destination, use `useRoute` on
the stack it owns. A tab can therefore keep its own history without taking
over the whole app.

## Choose a stack

Use the root stack for the main app flow. Use a named stack for independent
flows such as tabs, where each tab should remember its own screen. Keep modal
content separate from ordinary back-stack navigation.

Native deep links resolve against the same route manifest. `openWindow({data})`
opens another NativeScript window; the app provides
`Application.setWindowContentResolver()` to render that window's root.

The [navigation notes](navigation-notes.md) explain native containers, modal
roots, deep links, Android tab-stack limits, and the platform-specific
tradeoffs.
