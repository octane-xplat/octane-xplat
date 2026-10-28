# Move between screens

> Open another screen, pass it an address, and return to where you started.

Open a screen with a typed link, then return with the screen's own navigator.
A route is an address your app knows how to display, such as `/items/coat`.
Check [navigation limits](../testing/known-limits.md#navigation) for the
platforms you use.

Start with **Open your first route** below. Return to the later sections when
you need a specific workflow:

| Task | Section |
| --- | --- |
| Pass an item ID or filter | [Path, search, and loaded data](#separate-path-search-and-loaded-data) |
| Require sign-in | [Return after sign-in](#return-after-sign-in) |
| Show loading or recover from failure | [Pending work and failures](#handle-pending-work-and-failures) |
| Protect an unfinished form | [Unsaved edits](#confirm-before-leaving-unsaved-edits) |
| Open a modal screen | [Route modals](#present-a-route-modally) |
| Open the app from a URL | [Incoming links](#handle-incoming-links) |

## Open your first route

Create `src/app/items/[id].tsrx`. The `[id]` part captures the item ID from the
address. Generated types give the screen that ID as `params.id`.

```tsx
// src/app/items/[id].tsrx
import { Pressable, Screen, Text } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import type { RouteProps } from '../../routes.gen.contracts'

export function screen(props: RouteProps<'/items/:id'>) {
	const navigation = useRouter()

	return <Screen>
		<Text>{'Item: ' + props.params.id}</Text>
		<Pressable onPress={() => navigation.back()}><Text>Back</Text></Pressable>
	</Screen>
}
```

Run the generator from your app directory after adding or renaming route files.
The development and build commands also generate routes.

```sh
pnpm exec xplat routes --dir src/app
```

Replace the starter’s `src/App.tsrx` with the following component; both starter
entry modules already load that file. Import the generated client once here.
Place `RouteOutlet` under the providers your screens should inherit. Its children form the initial
screen; navigation displays routed screens through that outlet.

```tsx
// src/App.tsrx
import './routes.gen'
import { NavLink, RouteOutlet, Text } from '@octane-xplat/ui'

export function App() {
	return <RouteOutlet>
		<Text>My collection</Text>
		<NavLink to="/items/:id" params={{ id: 'coat' }}>Open coat</NavLink>
	</RouteOutlet>
}
```

The browser link has a real address. On native targets, activation opens the
screen in the owning flow. Missing IDs and unknown route patterns are type
errors in both links and navigation calls.

```tsx
import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/items/:id', params: { id: 'coat' } })
// Type errors: missing params, or a route the app does not declare.
// router.push({ to: '/items/:id' })
// router.push({ to: '/invented' })
```

## Choose the right navigation operation

Use `useRouter()` inside an outlet or routed screen. It follows that screen's
flow, including a retained tab, native Page, or modal. The imported `router`
facade starts from the application's root flow.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import { useCanGoBack, useRouter } from '@octane-xplat/ui/routing'

export function BackButton() {
	const navigation = useRouter()
	const available = useCanGoBack()

	return <Pressable disabled={!available} onPress={() => navigation.back()}>
		<Text>Back</Text>
	</Pressable>
}
```

`push` adds an entry. `replace` substitutes the current entry. `navigate` chooses
push unless `replace` is requested. Native and rendered pane hosts support
`reset`; browser history cannot erase earlier entries and returns `unsupported`.

```ts
import { router } from '@octane-xplat/ui/routing'

void router.push({ to: '/items/:id', params: { id: 'coat' } })
void router.replace({ to: '/items/:id', params: { id: 'hat' } })
void router.navigate({ to: '/items/:id', params: { id: 'cap' }, replace: true })
void router.reset({ to: '/items/:id', params: { id: 'glove' } })
```

Back at a flow's base returns `at-base`. Supply a typed fallback when returning
to another screen is appropriate. Dismissal closes an entire modal presentation;
Back inside a native modal walks its internal history.

```tsx
import { useRouter } from '@octane-xplat/ui/routing'
import { Pressable, Text } from '@octane-xplat/ui'

export function CloseActions() {
	const navigation = useRouter()

	return <>
		<Pressable onPress={() => navigation.back({ fallback: { to: '/items/:id', params: { id: 'coat' } } })}><Text>Back</Text></Pressable>
		<Pressable onPress={() => navigation.dismiss()}><Text>Close presentation</Text></Pressable>
	</>
}
```

For your next step, choose [loading and error feedback](#handle-pending-work-and-failures),
[route data](#separate-path-search-and-loaded-data), or
[sign-in routing](#return-after-sign-in). The generator details below explain
the generated files and help diagnose contract errors.

## What the route generator writes

Use `.contracts` for local screen, guard, and loader inputs. Importing the
generated client installs the catalog and registers its application types.
Application authors do not write `declare module` blocks.

```ts
// These imports have different jobs.
import './routes.gen'
import type { RouteProps, RouteGuardArgs, RouteLoaderArgs } from './routes.gen.contracts'
```

The generated `.catalog.<target>` modules contain reusable definitions without
configuring the default client. A custom host can import them independently.
The `.manifest.json` file is a description for tools; it contains no executable
loaders or rendering host.

```ts
// Custom browser host: importing definitions does not configure the client.
import { routes } from './routes.gen.catalog.web'
import type { ContractsOf } from '@octane-xplat/ui/routing/core'

type ApplicationContracts = ContractsOf<typeof routes>
```

Generation reads the source syntax without running screen modules. Named
callback exports and named re-exports are recognized; type-only exports,
comments and strings do not advertise runtime capabilities. Use explicit names
in route modules instead of `export *`. Running generation again preserves the
contents and timestamps of files that have not changed.

```ts
// src/app/items.tsx — callbacks may live outside the route directory.
export { Items as default, loader, beforeLoad, head } from '../screens/items'
```

If typechecking reports a `RouteExportChecks` error, fix the named export in
the source file. Guards, loaders and error boundaries must be functions;
search validation must be a function or a Standard Schema v1 validator. A
malformed export also stops catalog construction with `route/invalid-export`.
It cannot silently remove a guard and continue loading. For example, deny
access by throwing from a guard, rather than exporting or returning a text or
boolean flag. Guards return an added context object or no value; search parsers
return the validated search object. Async callbacks follow the same rules.
A callable guard or parser that returns the wrong shape fails during preparation,
before loading, if untyped code bypasses those compiler checks.

```ts
import { RouteForbidden } from '@octane-xplat/ui/routing/core'

// A deliberately closed route until its access policy is ready.
export function beforeLoad() {
	throw new RouteForbidden()
}
```

File names select public patterns and platform variants. `index` addresses its
directory; `_layout` wraps its descendants. A platform suffix chooses a screen
implementation without changing its public pattern. Screens use `.tsx`, `.tsrx`
or Markdown `.md`; plain `.ts` and `.js` helpers do not create routes.

```text
src/app/index.tsrx             /
src/app/items/[id].tsrx        /items/:id
src/app/items/[[id]].tsrx      /items/:id?
src/app/files/[...path].tsrx   /files/*path
src/app/items/_layout.tsrx     layout for items/*
src/app/settings.web.tsrx      /settings on web
src/app/settings.mobile.tsrx   /settings on iOS and Android
```

### Warm a screen before opening it

Generated `.tsx` and `.tsrx` routes load their code when first needed. To warm
an expected destination earlier, call `preload`. It leaves the current screen
alone and returns a result you can inspect. The destination uses the same typed
path and parameters as `push`.

```ts
import { router } from '@octane-xplat/ui/routing'

const destination = { to: '/items/:id', params: { id: 'coat' } } as const
const warmed = await router.preload(destination)
if (warmed.status === 'failed') {
	console.error('Could not download the screen', warmed.error)
}
// Later, when the user chooses the item:
await router.push(destination)
```

Preloading imports the module, including its top-level JavaScript, but does not
run search validation, context factories, guards, data loaders or head callbacks.
Keep request work in those callbacks. Navigation still runs them normally;
preloading is neither a data cache nor permission to enter a protected screen.
Layouts, Markdown content and explicitly imported programmatic catalogs remain
eager. Importing a screen yourself also makes that screen eager.

```ts
// src/app/items/[id].tsrx: keep request work inside callbacks.
import type { RouteLoaderArgs } from '../../routes.gen.contracts'

export async function loader({ params }: RouteLoaderArgs<'/items/:id'>) {
	const response = await fetch(`/api/items/${encodeURIComponent(params.id)}`)
	if (!response.ok) throw new Error('Could not load the item')

	return response.json()
}
```

An abort signal stops waiting for the preload without cancelling another caller's
shared import. Failed imports can be attempted again; the runtime may still cache
some module failures. On web, the build creates separate route chunks. Native
bundling follows its host: NativeScript supports dynamic imports, while AppKit's
single-bundle host inlines them. The same method is safe to call on either host;
it does not promise a smaller initial native bundle.

```ts
import { router } from '@octane-xplat/ui/routing'

const controller = new AbortController()
const pending = router.preload({ to: '/items/:id', params: { id: 'coat' } }, {
	signal: controller.signal,
})
controller.abort()
const result = await pending // { status: 'cancelled', reason: 'aborted' }
```

### Share routes across targets

An unsuffixed screen provides a shared destination. Every platform variant of
that destination must keep compatible path, search, context and loader-data
types. Generation writes checks for those contracts; typechecking reports the
route and source pair when they disagree. Share callback helpers when only the
screen's appearance needs to differ.

```tsx
// src/app/items/[id].web.tsx — same loader contract as [id].tsrx.
export { loader, validateSearch } from '../../item-data'

export { WebItem as default } from '../../screens/web-item'
```

The default `router`, `useRouter()`, links and redirects accept shared routes.
For a route that only has a screen on some targets, validate the destination
first. This works in shared code and keeps the familiar client. A missing screen
returns `not-found` with reason `unavailable`; this check does not load its data
or establish that its outlet is ready.

```ts
import { router } from '@octane-xplat/ui/routing'

const camera = await router.validateDestination({ to: '/camera' })
if (camera.status === 'valid') {
	await router.push(camera.destination)
}
```

An explicit router made from a target catalog accepts that target's paths
directly. Use this when [binding a custom host](#bind-a-custom-router-to-rendering).
A `.web` screen is also available to the Linux WebKit host; `.mobile` covers
iOS, Android and the generic mobile catalog. These availability rules describe
screen modules, not permission checks or host readiness.

```ts
import { routes } from './routes.gen.catalog.web'
import { createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'

export function createWebNavigation(host: RouterHost) {
	const navigation = createRouter({ catalog: routes, host })

	return {
		navigation, // Its creator calls navigation.dispose() when the host closes.
		openCamera: () => navigation.push({ to: '/camera' }), // camera.web.tsx exists.
	}
}
```

## Keep contracts current while developing

`xplat dev` watches the app's configured or conventional route directory. New,
renamed and removed route files refresh contracts while the dev server runs.
A source or bake error keeps the last successful generated files and reports
what needs repair. Fixing the source resumes generation. Web discovery accepts
Vite's [conventional configuration files](https://vite.dev/config/), including
`.js`, `.mjs`, `.cjs`, `.ts`, `.mts` and `.cts`. A JavaScript config does not
require conversion to TypeScript.

```sh
pnpm exec xplat dev web
```

Use `routes --watch` when you run your dev server separately. For routes owned
by a shared workspace package, run the watcher from that package once rather
than starting a generator in every platform shell.

```sh
pnpm exec xplat routes --watch
# From the workspace root, replace the name with your route package.
pnpm --filter @my/shared-app exec xplat routes --watch
```

The watcher follows the route tree, `xplat.routes.json`, and the source modules
referenced by its `manifests`, `context` and `transitions` fields. Keep `out`
fixed during a watch session. To move generated files, stop watching, regenerate,
update the client/type imports and remove the obsolete generated entries.
This avoids silently continuing to import stale contracts.

```json
{
	"directory": "src/app",
	"out": "src/routes.gen"
}
```

Changes to a loader's arbitrary filesystem inputs outside those watched paths
need explicit regeneration. Watch mode updates generated artifacts; runtime
screen updates still use the selected platform's dev-server reload mechanism.

```sh
pnpm exec xplat routes
```

## Recheck history after account changes

Browser Back and Forward run the destination's current search validation,
guards and loaders. A saved history entry is a location to prepare again;
its earlier admission does not authorize a later visit. Imperative Back checks
before moving history and returns `forbidden` when a guard refuses access.

```ts
const result = await router.back()
if (result.status === 'forbidden') {
	// Keep the current screen and show the application's sign-in action.
}
```

The browser's own Back and Forward controls move the URL before the router
receives an event. On denial, the router keeps the admitted screen visible and
returns to its history position. Correction waits at most five seconds. If the browser refuses correction,
does not acknowledge it, or the entry has no trustworthy position, the router
replaces that entry with the admitted URL and starts a new owned history base.
Retry repeats the refused direction with fresh context. Replacing an account's
outlet owner discards its prepared data; older URLs are prepared again if the
browser revisits them. These URL correction guarantees describe the web host.
iOS Frame edge swipes use the same preparation before the native pop.

```tsx
import { Button } from '@octane-xplat/ui'
import { useNavigation, useRouter } from '@octane-xplat/ui/routing'

export function RetryHistory() {
	const navigation = useRouter()
	const state = useNavigation()

	return state.status === 'failed'
		? <Button label="Try again" clickAction={() => { void navigation.retry() }} />
		: null
}
```

Programmatic NativeScript Frame Back, Android OS Back, and Back inside a
rendered desktop or native tab pane recheck validation, guards and loaders
before revealing their retained target. Denial keeps the
current pane visible; an admitted retry updates data while preserving the
target's local state and providers. A same-flow redirect replaces that retained
target and starts fresh local state. A redirect into another stack replaces that
stack's current screen while keeping the source's history. A modal redirect opens
over the admitted source. Neither path loads the prepared destination twice.
On iOS Frame flows, a completed leading-edge swipe requests this same guarded
Back after release. Short, cancelled and reversed drags do not navigate. The
native transition starts after admission; it does not track the finger. Built-in
full-content pops are disabled on router-owned Pages. Rendered panes and modal
dismissal gestures are separate from this Frame gesture.

```tsx
import { Button } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'

export function PaneBack() {
	const navigation = useRouter()

	return <Button label="Back" clickAction={() => { void navigation.back() }} />
}
```

Native modal dismissal rechecks the screen underneath before closing. If its
guard denies access, the modal stays open. After the account changes, retry
refreshes the presenter's data and retains its local state. Nested dismissal
refreshes the existing parent modal. An explicit `stack: 'root'` in a redirect
leaves a modal flow; omitting `stack` keeps the redirect in that flow. These
guarantees apply to canonical `dismiss()` and the claimed Android Back path.
Routed native modals are fullscreen and disable direct SDK cancellation. Use a
Close button that calls `dismiss()`; Android OS Back uses the same preparation
path. A forced host closure is reconciled after closing and cannot await a guard.

```ts
const result = await navigation.dismiss()
if (result.status === 'forbidden') {
	// Keep the modal open while the application restores access.
	// After the account changes: await navigation.retry()
}
```

## Confirm before leaving unsaved edits

Try **Test → Unsaved edits** in the shared harness app. Its
[complete screen](../../packages/app/src/app/navigation-blocking.tsrx) uses the
same API as the example below.

Use `useNavigationBlocker` inside the screen that owns the draft. When `when` is
true, a navigation waits for your confirmation panel before reading context or
running guards and loaders. Statically invalid destinations fail without opening
a confirmation. The hook inherits its rendering flow, including a
custom router provider; it exposes no loader data and needs no generic type.

```tsx
import { useState } from 'octane'
import { Button, Text, View } from '@octane-xplat/ui'
import { useNavigation, useNavigationBlocker, useRouter } from '@octane-xplat/ui/routing'

export function DraftScreen() {
	const [dirty, setDirty] = useState(false)
	const navigation = useRouter()
	const blocker = useNavigationBlocker({ when: dirty })

	return <View>
		<Button label="Edit draft" clickAction={() => setDirty(true)} />
		<Button label="Back" clickAction={() => { void navigation.back() }} />
		{blocker.status === 'blocked' ? <View>
			<Text>Leave without saving?</Text>
			<Button label="Keep editing" clickAction={blocker.reset} />
			<Button label="Leave screen" clickAction={blocker.proceed} />
		</View> : null}
	</View>
}
```

`reset()` cancels the held attempt and keeps the current screen and local state.
`proceed()` resumes that attempt with current context, guards and loaders. Its
status stays `proceeding` until navigation settles; animation can finish later.
Old controls cannot approve a newer attempt. Clearing `when` or unmounting the
blocked declaration cancels the held attempt, without turning it into a loading
error. Use the blocker controls for confirmation; `retry()` has a different job.

```ts
// Inside the screen's event handler, after reading `blocker` from the hook:
if (blocker.status === 'blocked') {
	blocker.reset() // Stay on this screen.
}
```

If saving should continue the held navigation, keep its confirmation active
while the save runs. Approve before clearing the dirty flag; a cleared condition
cancels a request that is still waiting for confirmation.

```ts
// Add this handler inside DraftScreen; pass your application's save function.
async function saveAndLeave(saveDraft: () => Promise<void>) {
	if (blocker.status !== 'blocked') return
	await saveDraft()
	blocker.proceed()
	setDirty(false)
}
```

The ordinary navigation snapshot remains `pending` while a choice is held. In
this editor, use its blocker state to distinguish a confirmation panel from
loading feedback. Destination fields are unvalidated inputs; Back or dismissal
can have no destination yet, and this state exposes no loader data.

```ts
// Inside DraftScreen, alongside the existing blocker hook:
const state = useNavigation()
const choosing = blocker.status === 'blocked'
const opening = state.status === 'pending' && !choosing
if (choosing) console.log(blocker.action, blocker.destination?.to)
```

Several active declarations in one flow must all approve, starting with the
newest registration. An older retained entry with the same URL cannot block the
current entry. Another named flow has its own confirmation state. Include your
app's tab visibility in `when` if background navigation should proceed without
that tab's confirmation panel.

```tsx
// Inside a tab whose editor receives these values from the application:
function TabConfirmation(props: { dirty: boolean; visible: boolean }) {
	const blocker = useNavigationBlocker({ when: props.dirty && props.visible })

	return blocker.status === 'blocked'
		? <Button label="Keep editing" clickAction={blocker.reset} />
		: null
}
```

A refresh stays in the same entry and does not ask for leave confirmation.
Redirects continue the approved attempt. The hook protects navigation in its
owning flow; it cannot veto owner replacement, raw host operations or process
exit. Keep drafts outside a route's lifetime when they must survive those events.

```ts
await navigation.refresh() // Revalidate the current screen without a leave panel.
```

| Target or action | Supported boundary |
| --- | --- |
| Web client navigation | Router requests and browser Back/Forward. Refusal corrects history without displaying or loading the rejected target. |
| iOS Frame Back | Completed leading-edge drag asks after release, before a native pop. No interactive preview. |
| Android Back | The claimed OS Back event asks before Frame traversal or modal dismissal. Predictive animation is unqualified. |
| Native routed modal | Canonical dismissal asks within the modal flow. Direct SDK cancellation is disabled on fullscreen surfaces. |
| AppKit panes and routed modals | Canonical navigation and in-window modal dismissal use the same confirmation. Escape/outside callbacks request guarded dismissal; raw host closure is cleanup. |
| Linux WebKitGTK | The production app passed handler-driven confirmation, refusal and approval checks in its actual Linux WebView. OS input and the separate GTK/GJS renderer remain unqualified. |
| Windows | Shared contract and types. No Windows VM is available. |
| Document reload, external links, window/process exit, forced owner teardown | Outside this client confirmation hook. Browser unload prompts and native exit policy need their own integration. |

## Separate path, search, and loaded data

Path parameters identify a route location. Search parameters are the values
after `?`. Validate external search input before a guard, loader, or screen
uses it; the validator's output becomes their inferred type. Keep literal values
narrow with `as const`, so navigation accepts only the validated tab names.

```tsx
// Add to src/app/items/[id].tsrx.
export function validateSearch(raw: { tab?: unknown }) {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details' && tab !== 'activity') throw new TypeError('Invalid tab')

	return { tab } as const
}
```

You can give the output a named interface instead. Replace the function above
with this version when you already share that shape elsewhere. Interfaces and
object type aliases preserve the same search inference; no index signature is
needed. Return the validated fields in a plain object.

```ts
// src/app/items/[id].tsrx
export interface ItemSearch { tab: 'details' | 'activity' }

export function validateSearch(raw: { tab?: unknown }): ItemSearch {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details' && tab !== 'activity') throw new TypeError('Invalid tab')

	return { tab }
}
```

You can instead export a [Standard Schema v1](https://standardschema.dev/schema)
validator from your app's validation library. Its protocol must produce a search
object. Routing uses that output, including defaults and validation issues,
even when the schema is also callable.
This small schema shows the interface without a validation-library dependency;
use it instead of the function above.

```ts
// src/app/items/[id].tsrx
import type { RouteSearchSchema } from '@octane-xplat/ui/routing/core'

export const validateSearch: RouteSearchSchema<
	{ tab?: 'details' | 'activity' },
	{ tab: 'details' | 'activity' }
> = {
	'~standard': {
		version: 1,
		vendor: 'app',
		validate(raw) {
			const tab = (raw as { tab?: unknown }).tab ?? 'details'

			return tab === 'details' || tab === 'activity'
				? { value: { tab } }
				: { issues: [{ message: 'Choose details or activity.' }] }
		},
	},
}
```

A schema that requires numbers or booleans needs an explicit URL decoder.
Wrap it with `withSearchDecoder`: the decoder converts URL strings into the
schema's input, and the schema checks the result. Both typed destinations and
pasted URLs use this path. A bare number-only schema is a type error; a schema
that already accepts strings or unknown input can be used directly.

```ts
// src/app/pages.tsrx: use with your page screen.
import { withSearchDecoder, type RouteSearchSchema } from '@octane-xplat/ui/routing/core'

const pageSchema: RouteSearchSchema<{ page?: number }, { page: number }> = {
	'~standard': {
		version: 1,
		vendor: 'app',
		validate(raw) {
			const page = (raw as { page?: unknown }).page ?? 1

			return typeof page === 'number' && Number.isInteger(page) && page > 0
				? { value: { page } }
				: { issues: [{ message: 'Choose a positive page number.' }] }
		},
	},
}

export const validateSearch = withSearchDecoder(pageSchema, raw => ({
	page: raw.page === undefined ? undefined : Number(raw.page),
}))
// Navigation accepts search: { page: 2 }; /pages?page=2 produces search.page === 2.
```

Navigation supplies search separately from path parameters. A defaulted field
may be omitted from navigation input while the screen receives its validated
value. Repeated URL search keys reach validation as arrays; numbers and objects
are not silently restored from a special URL encoding.

```ts
import { router } from '@octane-xplat/ui/routing'

void router.push({
	to: '/items/:id',
	params: { id: 'coat' },
	search: { tab: 'activity' },
	hash: 'history',
})
```

Loaders receive structured inputs. Their result becomes `props.data`; it stays
separate from path parameters, search, and context. A new navigation preserves
the committed screen while preparation runs.

```tsx
// Add to src/app/items/[id].tsrx; RouteProps now includes this loader's result.
import type { RouteLoaderArgs } from '../../routes.gen.contracts'

export function loader({ params, search }: RouteLoaderArgs<'/items/:id'>) {
	return { title: params.id, selectedTab: search.tab }
}
```

For shared server records, see [preparing the next screen](data.md#preparing-the-next-screen).

Read one route's inferred contract with `getRouteApi`. These hooks read the
rendering entry, so a hidden retained screen keeps its own parameters and data.
An accessor throws if used outside its matching route.

```tsx
import { Text } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'

const item = getRouteApi('/items/:id')

export function ItemSummary() {
	const params = item.useParams()
	const data = item.useLoaderData()

	return <Text>{params.id + ': ' + data.title}</Text>
}
```

## Edit the current screen's filters

Use `useUpdateSearch()` from a route accessor to change that screen's search
fields. A callback receives validated values and returns the entire next search
input. Preserve a field explicitly when you want to keep it. Updates replace
history by default and rerun guards and loaders through normal navigation.

```tsx
import { Button } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'

const item = getRouteApi('/items/:id')

export function ActivityFilter() {
	const updateSearch = item.useUpdateSearch()

	return <Button label="Show activity" clickAction={() => {
		void updateSearch(previous => ({ ...previous, tab: 'activity' }))
	}} />
}
```

Omitted fields are removed; the schema applies defaults again. Pass
`replace: false` to make an edit a destination that Back can restore. The
updater keeps the entry's path parameters, fragment and owning flow, including
a modal's inner flow. It uses no animation and the host's ordinary navigation
scroll behavior: on web, the fragment is restored or the page starts at the
top. It cannot edit a hidden retained entry or a different record; a stale
callback returns `cancelled` without calling your updater function.

```tsx
export function ClearFilter() {
	const updateSearch = item.useUpdateSearch()

	return <Button label="Clear filter" clickAction={() => {
		void updateSearch({}, { replace: false })
	}} />
}
```

## Guard a route and supply context

A guard can add values to the loader and screen context, or redirect before the
attempted route commits. Redirect destinations use the same types as links.
Use the route's generated local inputs inside its own callbacks.

```tsx
// Add to src/app/items/[id].tsrx.
import { redirect } from '@octane-xplat/ui/routing'
import type { RouteGuardArgs } from '../../routes.gen.contracts'

export function beforeLoad({ params }: RouteGuardArgs<'/items/:id'>) {
	if (params.id === 'old-coat') redirect({ to: '/items/:id', params: { id: 'coat' } })

	return { checked: true }
}
```

Configure root dependencies with an object or factory export. The generator
imports it into client startup, and each preparation takes a context snapshot.
Keep a route's own callbacks independent of the complete application's inferred
route state to avoid circular type inference.

```ts
// src/routing-context.ts
export function routingContext() {
	return { account: { id: 'demo-account' } }
}
```

```json
{
	"directory": "src/app",
	"context": { "module": "./src/routing-context.ts", "export": "routingContext" }
}
```

The generated callback types include those dependencies and any additions from
the route's guard. Client guards are navigation policy; a server endpoint still
needs to authorize the data it returns.

```tsx
// src/app/items/[id].tsrx
import type { RouteLoaderArgs } from '../../routes.gen.contracts'

export function loader({ params, context }: RouteLoaderArgs<'/items/:id'>) {
	return { title: params.id, owner: context.account.id, checked: context.checked }
}
```


## Prepare a group of routes

Create a group when several routes share a guard or loaded dependency. A group's
guard runs first; its loader result is available to descendants under
`context[group.id]`. The root context still comes from your configured context
factory. This example uses the account dependency configured above.

```ts
// src/route-groups.ts
import { defineRouteGroup, RouteForbidden } from '@octane-xplat/ui/routing/core'

export const account = defineRouteGroup.withContext<{ account: { id: string } | null }>()({
	id: 'profile',
	beforeLoad({ context }) {
		if (!context.account) throw new RouteForbidden()

		return { user: context.account }
	},
	loader: ({ context }) => ({ id: context.user.id }),
})

export const project = account.group({
	id: 'project',
	loader: ({ context }) => ({ owner: context.profile.id }),
})
```

A file route joins the group with a named `group` export. Its generated callback
and screen types include parent context and data. File names and layout wrappers
alone do not add lifecycle behavior; membership is explicit.

```tsx
// src/app/projects/[id].tsrx
import { Text } from '@octane-xplat/ui'
import type { RouteLoaderArgs, RouteProps } from '../../routes.gen.contracts'

export { project as group } from '../../route-groups'

export function loader({ params, context }: RouteLoaderArgs<'/projects/:id'>) {
	return { title: params.id, owner: context.project.owner }
}

export default function Project(props: RouteProps<'/projects/:id'>) {
	return <Text>{props.data.title}: {props.context.profile.id}</Text>
}
```

For programmatic routes, call the group's `route` method and attach a named
screen as usual. The catalog requires only root dependencies; parent loader
results are prepared by routing. The maintained guide routes use this pattern.

```tsx
import { Text } from '@octane-xplat/ui'
import { defineRoutes } from '@octane-xplat/ui/routing/core'
import { project } from './route-groups'

function ProjectSettings(props: { data: { owner: string } }) {
	return <Text>{props.data.owner}</Text>
}

export const projectRoutes = defineRoutes([
	project.route({
		path: '/project-settings',
		loader: ({ context }) => ({ owner: context.project.owner }),
	}).screen(ProjectSettings),
])
```

Each preparation runs the outer group's guard and loader, then inner groups,
then the route's own guard and loader. Parent failure, redirect or cancellation
stops child work. Direct URLs, Back and refresh use the same chain; group data
is prepared again rather than cached across navigations.

```ts
import { router } from '@octane-xplat/ui/routing'

await router.navigateUrl('/projects/coat') // Prepares account, project, then the route.
await router.refresh() // Checks those dependencies again.
```

## Return after sign-in

After your sign-in code updates the session used by `routingContext`, pass the
requested URL to `navigateUrl` with `replace: true`. It checks the URL policy,
search schema and current guards before loading. Replacing keeps the login
entry out of the return path. A matched URL from `resolveUrl` is still runtime
input, so it does not need a cast into the typed destination union.
When an account change replaces the outlet owner, pass the URL through
`resumeUrl` using the handoff below. Work started by the retiring owner can be
cancelled as that tree is removed.

```ts
import { router } from '@octane-xplat/ui/routing'

// Call after the application's sign-in operation has updated its session.
export function returnAfterSignIn(returnUrl: string) {
	return router.navigateUrl(returnUrl, { replace: true })
}
```

An invalid URL, untrusted origin or forbidden scheme returns a failure and
keeps the committed screen. Handle the result in your sign-in UI, using the
same recovery UI as other navigation. Configured trusted origins normalize to
internal app routes; this API does not open an external page.

```ts
export async function returnMessage(returnUrl: string) {
	const result = await returnAfterSignIn(returnUrl)
	if (result.status === 'invalid-input') {
		return 'Choose a screen in this app to continue.'
	}

	return null
}
```

Each preparation reads the root context once. Synchronous factories are copied
before preparation yields; a later top-level account update belongs to the next
attempt. The copy is shallow so service instances keep their identity. Return
fresh account values rather than mutating nested account objects during an
attempt. Asynchronous sources must supply a consistent snapshot when they resolve.

```ts
// src/routing-context.ts — readSession belongs to your authentication service.
import { readSession } from './session'

export function routingContext() {
	const session = readSession()

	return { account: session.account ? { ...session.account } : null }
}
```

Pass an `authority` token to the common root outlet when account identity or
permissions change. A new token retires that outlet's retained screens, nested
panes, modals and pending work. Keep the outlet below the providers screens
need. Your session store owns the token; update it together with the account.
Application services and caches keep their own cleanup policy.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'

export function SessionApp(props: { authorityVersion: number }) {
	return <RouteOutlet authority={props.authorityVersion}>
		<Text>Choose a screen.</Text>
	</RouteOutlet>
}
```

When sign-in also changes authority, pass the requested URL as `resumeUrl` in the
same update. The replacement owner consumes one return after startup settles,
using URL policy, schemas and guards with replacement navigation. A failed
return is consumed too, so it cannot cause a retry loop. Handle the result with
`onResume`; a retired owner cannot deliver a late completion callback. Replace
the small component above with this version.

```tsx
import { useState } from 'octane'
import { RouteOutlet, Text } from '@octane-xplat/ui'

export function SessionApp(props: { authorityVersion: number; returnUrl?: string }) {
	const [message, setMessage] = useState('Choose a screen.')

	return <RouteOutlet
		authority={props.authorityVersion}
		resumeUrl={props.returnUrl}
		onResume={result => setMessage(result.status === 'committed'
			? 'Choose a screen.' : 'Could not open that screen.')}
	>
		<Text>{message}</Text>
	</RouteOutlet>
}
```

## Handle pending work and failures

`useNavigation()` subscribes to the owning flow and returns `idle`, `pending`,
or `failed`. While another destination prepares, the previous committed screen
stays visible. `useRouterState().navigation` exposes the same state alongside
the committed match and Back availability.

```tsx
import { Text } from '@octane-xplat/ui'
import { useNavigation } from '@octane-xplat/ui/routing'

export function NavigationStatus() {
	const state = useNavigation()

	return <Text>{state.status === 'pending' ? 'Opening…' : 'Ready'}</Text>
}
```

Await navigation to learn whether it committed, failed, was cancelled, or could
not run on the host. Guard and loader failures currently return a result and
preserve the previous screen. `retry` repeats the latest failed attempt;
`refresh` prepares the current entry again and retains its local state.

```ts
import { router } from '@octane-xplat/ui/routing'

const result = await router.push({ to: '/items/:id', params: { id: 'coat' } })
if (result.status === 'failed') {
	console.error('Navigation failed in phase:', result.phase)
	// Trigger this from a Retry action after showing an error message.
	await router.retry()
}
await router.refresh()
```

Links also publish failures through this state, so a link's loading failure
does not disappear into an unobserved promise. Handle ordinary missing or
forbidden destinations separately from unexpected failures. `retry()` repeats
the failed request in this flow, including its captured inputs;
`clearFailure()` dismisses that feedback and retry target without navigating.
Save this expanded status component as `src/navigation-feedback.tsrx`. It
handles loading and failure feedback within its owning flow.

```tsx
import { Pressable, Text, View } from '@octane-xplat/ui'
import { useNavigation, useRouter } from '@octane-xplat/ui/routing'

export function NavigationFeedback() {
	const state = useNavigation()
	const navigation = useRouter()
	if (state.status === 'pending') return <Text>Opening…</Text>
	if (state.status !== 'failed') return null
	const message = state.result.status === 'not-found' ? 'Page not found.'
		: state.result.status === 'forbidden' ? 'You do not have access.'
		: state.result.status === 'invalid-input' ? 'Check this link.'
		: 'Could not open this screen.'

	return <View>
		<Text>{message}</Text>
		<Pressable onPress={() => { void navigation.retry() }}><Text>Try again</Text></Pressable>
		<Pressable onPress={() => navigation.clearFailure()}><Text>Dismiss</Text></Pressable>
	</View>
}
```

To keep root feedback visible beside the outlet, place both beneath
`RouterProvider` after generated startup has configured the client. Named panes
can place the feedback component inside their own flow instead.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'
import { RouterProvider, router } from '@octane-xplat/ui/routing'
import { NavigationFeedback } from './navigation-feedback'

export function App() {
	return <RouterProvider router={router}>
		<NavigationFeedback />
		<RouteOutlet><Text>Choose a screen.</Text></RouteOutlet>
	</RouterProvider>
}
```

Successful commitment clears the failure. A retry temporarily reports `pending`;
if it is cancelled, the prior failure remains available until cleared or a
later request succeeds. Cancellation itself is not an error. Feedback snapshots
contain readonly URL input, never a successfully validated search result or
loaded DTO; use the screen's route accessor for that data.

```ts
import { router } from '@octane-xplat/ui/routing'

const state = router.getSnapshot().navigation
if (state.status === 'pending') console.log(state.action, state.destination?.to)
if (state.status === 'failed') console.log(state.result.status)
router.clearFailure()
```

Mount the outlet before starting imperative navigation. A mounted native outlet
waits for its Frame's initial navigation event; the wait is bounded and cancels
with its owner. A blocked result can identify a missing outlet or an unavailable
host, so it is useful to keep that reason in development diagnostics.

```ts
import { router } from '@octane-xplat/ui/routing'

export async function openItem(id: string) {
	const result = await router.push({ to: '/items/:id', params: { id } })
	if (result.status === 'blocked') console.warn(result.reason ?? 'Navigation blocked')

	return result
}
```

Missing URL patterns, unavailable platform screens, missing resources, invalid
input, and forbidden access are distinct outcomes. A loader can throw the
explicit resource or permission errors; the host or calling UI chooses the
message to display.

```ts
import { RouteForbidden, RouteResourceNotFound } from '@octane-xplat/ui/routing/core'

export function requireItem(item: { title: string } | null, allowed: boolean) {
	if (!allowed) throw new RouteForbidden()
	if (!item) throw new RouteResourceNotFound()

	return item
}
```

Choose messages from the structured result instead of showing private error
objects. A missing URL pattern, a missing record, and a screen unavailable on
the current platform can each get an appropriate message.

```ts
import type { NavigationFailure } from '@octane-xplat/ui/routing'

export function navigationMessage(result: NavigationFailure): string {
	if (result.status === 'not-found') {
		if (result.reason === 'unavailable') return 'This screen is unavailable on this device.'
		if (result.reason === 'resource') return 'This item no longer exists.'

		return 'Page not found.'
	}
	if (result.status === 'forbidden') return 'You do not have access.'
	if (result.status === 'invalid-input') return 'Check this link.'
	if (result.status === 'blocked') return 'Navigation is not ready. Try again.'
	if (result.status === 'unsupported') return 'This navigation is unavailable here.'

	return 'Could not open this screen. Try again.'
}
```

A route's `ErrorBoundary` export handles errors thrown while rendering its
screen or layouts. Its reset function remounts that subtree; rerun a loader
with the navigator's retry or refresh operation.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import type { RouteErrorBoundaryProps } from '@octane-xplat/ui/routing'

export function ErrorBoundary({ reset }: RouteErrorBoundaryProps) {
	return <Pressable onPress={reset}><Text>Try rendering again</Text></Pressable>
}
```

## Use named panes with the canonical client

Declare named flows in configuration. A tab's `stack` mounts its outlet;
ordinary tabs without a stack remain UI-only and do not construct a router.

```json
{
	"directory": "src/app",
	"stacks": ["catalog", "account"]
}
```

```tsx
import './routes.gen'
import { RouteOutlet, Tabs, Text } from '@octane-xplat/ui'
import type { TabSpec } from '@octane-xplat/ui'

function CatalogBase() { return <Text>Choose an item</Text> }

function AccountBase() { return <Text>Account</Text> }

const tabs: readonly TabSpec[] = [
	{ key: 'catalog', title: 'Catalog', stack: 'catalog', render: CatalogBase },
	{ key: 'account', title: 'Account', stack: 'account', render: AccountBase },
]

export function Sections() {
	return <RouteOutlet><Tabs tabs={tabs} defaultSelectedKey="catalog" /></RouteOutlet>
}
```

A screen's unqualified navigator returns to its owning pane. Imperative code
can choose a named flow explicitly. Selection is independent UI state; tab
panes and their base content remain mounted across selection changes.

```ts
import { router } from '@octane-xplat/ui/routing'

await router.forStack('catalog').push({ to: '/items/:id', params: { id: 'coat' } })
await router.forStack('catalog').back()
```

### Share a pane URL

Named panes use an explicit `@` segment in their URLs. Root routes and catch-all
routes can use the same names without taking over a pane's destination. Let
`href` encode the stack, path and search values; a literal `@` in a root path is
encoded as `%40`. Unknown stack markers return `invalid-input` before loading.
Existing links using the old `/catalog/...` prefix must use `/@catalog/...`.

```ts
import { router } from '@octane-xplat/ui/routing'

const href = router.forStack('catalog').href({ to: '/items/:id', params: { id: 'coat' } })
// /@catalog/items/coat
```

## Present a route modally

Use presentation for the surface and transition for motion. Native modals own
an internal history: Back at their first screen returns `at-base`, and dismiss
closes the presentation. Browser modals use the document's linear history.
AppKit uses a fullscreen modal surface inside the declaring window, with its own
retained history and providers. Escape and outside dismissal request the same
guarded operation; native keyboard and pointer input are not yet qualified.

```ts
import { router } from '@octane-xplat/ui/routing'

const result = await router.push({
	to: '/items/:id',
	params: { id: 'coat' },
	presentation: 'modal',
	transition: 'none',
})
if (result.status === 'committed') await result.finished
```

Browser routed modals use a dialog surface, keep keyboard focus inside it and
make the background inert. Escape requests the same guarded `dismiss()` operation
as a Close button. A route's `head.title` names the dialog; without a title the
accessible name is “Dialog”. This is keyboard/DOM behavior; screen-reader input
has not been qualified.

```tsx
// Add to src/app/items/[id]/edit.tsrx.
export const head = () => ({ title: 'Edit item' })
```

Moving between screens keeps the modal's original return target. Dismissal
returns focus to that opener when it remains available. If admission re-renders the
presenter, a stable DOM `id` lets the router find its replacement. When the
opener is gone, a remaining parent modal receives focus; there is no promise to
recreate a removed control.

```tsx
// EditTrigger.web.tsx
import { useRouter } from '@octane-xplat/ui/routing'

export function EditTrigger() {
	const navigation = useRouter()

	return <button id="edit-item" onClick={() => navigation.push({
		to: '/items/:id/edit', params: { id: 'coat' }, presentation: 'modal',
	})}>Edit item</button>
}
```

On AppKit, a nested modal returns to its parent when dismissed. The first step's
Back returns `at-base`; call `dismiss` to close that flow. Forced window closure
or owner removal releases the modal family. A configured AppKit transition
animates the modal's content after it appears; dismissing mid-effect settles
the motion as `skipped` without undoing the commit.

```tsx
import { Button, View } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'

function EditActions() {
	const navigation = useRouter()

	return <View>
		<Button label="Back" clickAction={() => { void navigation.back() }} />
		<Button label="Close" clickAction={() => { void navigation.dismiss() }} />
	</View>
}
```

The `+modal` file suffix supplies the default presentation. A `+fade` suffix
supplies a push with a fade transition. A target that cannot animate a requested
transition can commit navigation and report a skipped transition separately.
Browser `fade` and `default` use same-document View Transitions when available.
Native custom Frame effects use the adapter below; other native surfaces have
explicit subsets.

```text
src/app/about+modal.tsrx     default modal presentation
src/app/welcome+fade.tsrx    default push presentation with fade motion
```

## Animate browser navigation

Request `fade` to animate a browser route change. Guards and loaders finish
before the browser captures the old screen. The router updates the URL and
flushes the new DOM inside the transition callback. This works with ordinary
client rendering; it does not require an SSR host.

```ts
import { router } from '@octane-xplat/ui/routing'

const result = await router.push({
	to: '/items/:id', params: { id: 'coat' }, transition: 'fade',
})
if (result.status === 'committed') {
	// The new screen is ready here. Animation may still be running.
	const animation = await result.finished
	console.log(animation.status)
}
```

Register a custom name in a browser leaf, then reference that export in
`xplat.routes.json`. The generated registration supplies the allowed names;
do not handwrite a `declare module` block. CSS defines the visual effect, and
`types` selects its forward or Back variation.

```ts
// src/transitions.web.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineWebTransition } from '@octane-xplat/ui/web'

export const transitions = defineTransitions({
	detail: defineWebTransition({
		reducedMotion: 'skip',
		types: ({ direction }) => ['detail-' + direction],
	}),
})
```

```json
{
	"directory": "src/app",
	"transitions": { "module": "./src/transitions", "export": "transitions" }
}
```

```css
html:active-view-transition-type(detail-forward)::view-transition-new(root) {
	animation: detail-enter 240ms ease-out both;
}
@keyframes detail-enter {
	from { opacity: 0; transform: translateX(16px); }
	to { opacity: 1; transform: translateX(0); }
}
```

Declare the same keys in other platform leaves. Until the application supplies
a native effect, a shared fallback can explicitly skip its animation. The
route still commits. Built-in `none` always skips animation; unsupported
browsers and reduced-motion preferences also skip by default. A new navigation
interrupts the preceding animation without undoing its accepted route.

```ts
// src/transitions.ts — fallback for targets without a custom leaf
import { defineTransitions } from '@octane-xplat/ui/routing/core'

export const transitions = defineTransitions({ detail: { kind: 'skip' } })
```

```ts
// After regenerating routes:
import { router } from '@octane-xplat/ui/routing'

await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'detail' })
```

## Animate native pages

Use the same configured transition keys in a `.mobile.ts` leaf. A native page
factory returns NativeScript navigation options; `duration` is in milliseconds.
The factory runs after guards and loaders, once for each opened Frame entry.
NativeScript reverses that selected effect on Back. Supply `page`, `view` or
both on one definition — an absent implementation reports `skipped` on that
kind of host.

```ts
// src/transitions.mobile.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'

export const transitions = defineTransitions({
	detail: defineNativeTransition({
		page: () => ({ name: 'slideLeft', duration: 240 }),
	}),
})
```

`view` animates incoming routed modal surfaces and retained rendered panes,
which have no Frame page. The router presents the surface unanimated, then runs
the SDK `Animation` engine on a router-owned content wrapper from the `from`
starting values to neutral — opacity and scale 1, translation and rotation 0.
Translations use DIP and rotation uses degrees; `duration` is milliseconds and
`curve` accepts `'linear' | 'easeIn' | 'easeOut' | 'easeInOut'`. Dismissal or
replacement interrupts the effect and restores neutral values. Built-in `fade`
animates content opacity for 240 ms. The `view` subset is unsupported on GTK
and Windows, which report `skipped`.

```ts
// src/detail-view.mobile.ts
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'

export const detail = defineNativeTransition({
	view: {
		from: ({ direction }) => ({
			opacity: 0,
			translateX: direction === 'back' ? -24 : 24,
		}),
		duration: 240,
		curve: 'easeOut',
	},
})
```

Return an instance to adapt a NativeScript `Transition` subclass. Construct it
inside the factory so each retained entry owns its effect. Native factories
are synchronous; loading data belongs in the route loader. Reduced motion is
sampled when selecting the entry's effect, with `skip` as the default. A factory
error produces an unanimated commit and a separate failed animation result.

```ts
// src/detail.mobile.ts
import { FadeTransition } from '@nativescript/core/ui/transition/fade-transition'
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'

export const detail = defineNativeTransition({
	reducedMotion: 'skip',
	page: () => ({ instance: new FadeTransition(240) }),
})
```

An explicit router also infers its transition names directly from the registry.
Its methods keep that local union; unrelated generated application names do
not enter the instance.

```ts
import { createRouter, defineRoute, defineRoutes, defineTransitions } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
import { detail } from './detail.mobile'

export function createDetailNavigation(host: RouterHost) {
	const navigation = createRouter({
		catalog: defineRoutes([defineRoute({ path: '/detail/:id' }).screen(() => null)]),
		transitions: defineTransitions({ detail }),
		host,
	})

	return {
		navigation,
		open: (id: string) => navigation.push({ to: '/detail/:id', params: { id }, transition: 'detail' }),
	}
}
```

## Animate AppKit panes

On macOS, use `defineAppKitTransition` for an incoming retained pane. Its
`from` values animate back to the wrapper's normal appearance: opacity and scale
1, translation and rotation 0. Duration is in milliseconds, translation uses
layout units and rotation uses degrees. The screen keeps its own styles.

```ts
// src/transitions.macos.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineAppKitTransition } from '@octane-xplat/ui/macos'

export const transitions = defineTransitions({
	detail: defineAppKitTransition({
		from: ({ direction }) => ({
			opacity: 0.2,
			translateX: direction === 'back' ? -24 : 24,
		}),
		duration: 240,
	}),
})
```

The router owns this animation after the destination has rendered. It restores
the wrapper on completion, replacement or disposal. Back uses the departing
entry's definition with `direction: 'back'`; a failed effect leaves navigation
committed. Reduced motion skips the effect by default. The same definition also
animates routed AppKit modal content after the surface appears. This helper
uses a linear tween without outgoing-screen snapshots; native GTK and Windows
report `skipped` for it.

```ts
import { router } from '@octane-xplat/ui/routing'

// With the detail transition configured and route contracts generated:
const result = await router.push({
	to: '/items/:id', params: { id: 'coat' }, transition: 'detail',
})
if (result.status === 'committed') console.log(await result.finished)
```

## Links and active matching

Use destination props directly on `NavLink`. Web keeps real anchors, modified
clicks, browsing contexts, and downloads. Native activation stays in the owning
flow; `target`, `rel`, and `download` describe browser behavior only.

```tsx
import { NavLink } from '@octane-xplat/ui'

const links = <>
	<NavLink to="/items/:id" params={{ id: 'coat' }} activeClassName="selected">Coat</NavLink>
	<NavLink to="/items/:id" params={{ id: 'coat' }} target="_blank" rel="noopener">Open separately</NavLink>
</>
```

Exact matching is the default. Use prefix matching for a section, and choose
whether all search keys, selected keys, or the fragment affect active state.
Disabled links and prevented activation do not navigate on any target.

```tsx
import { NavLink } from '@octane-xplat/ui'

const item = <NavLink to="/items/:id" params={{ id: 'coat' }} match="prefix"
	matchSearch={['tab']} matchHash activeClassName="selected"
	onPress={event => event.preventDefault()}>
	Coat
</NavLink>
```

## Put typed routes in navigation components

Use the same `to`, `params`, and `search` fields in sidebars, top bars,
breadcrumbs, heading menus, menu links, and navigation tabs. The examples here
use the `/items/:id` route defined above. Keep `href` for a raw URL. Choose one
of `to` or `href` for each item; omit both for an action button.

```tsx
import { SideNavItem, TopNavItem, NavHeadingMenuItem } from '@octane-xplat/ui'

const sidebar = <SideNavItem label="Coat" to="/items/:id" params={{ id: 'coat' }} />
const topBar = <TopNavItem label="Activity" to="/items/:id"
	params={{ id: 'coat' }} search={{ tab: 'activity' }} />
const heading = <NavHeadingMenuItem label="Help" href="https://example.com/help" />
const action = <SideNavItem label="Open tools" onClick={() => console.log('Tools')} />
```

Item arrays keep the same checks. `satisfies` checks the array against its
component's item type without discarding specific route names. The readonly
array can be reused in a breadcrumb, including its overflow menu. Nested menu
sections and submenus check each link's inputs too.

```tsx
import { Breadcrumbs, DropdownMenu } from '@octane-xplat/ui'
import type { BreadcrumbItem } from '@octane-xplat/ui'

const ancestors = [
	{ label: 'Coat', to: '/items/:id', params: { id: 'coat' } },
	{ label: 'Activity' },
] as const satisfies readonly BreadcrumbItem[]

const trail = <Breadcrumbs items={ancestors} />
const menu = <DropdownMenu trigger="Open" items={[
	{ type: 'link', key: 'coat', label: 'Coat', to: '/items/:id', params: { id: 'coat' } },
]} />
```

Route items derive their selected state from the current route. Disabled items
cannot navigate. Web links retain their real URL and modified-click behavior;
on phones and AppKit panes, activation uses the rendering flow. To cancel an
activation, call `preventDefault()` in the item's callback.

```tsx
import { SideNavItem } from '@octane-xplat/ui'

const disabled = <SideNavItem label="Coat" to="/items/:id"
	params={{ id: 'coat' }} isDisabled />
const paused = <SideNavItem label="Coat" to="/items/:id"
	params={{ id: 'coat' }} onClick={event => event.preventDefault()} />
```

A navigation `Tab` opens a route. Its `value` remains a stable selection key;
the route determines selected styling. For local panels, use
`role="tablist"`, `panelId`, and controlled selection instead. A typed `to`
in that panel pattern throws rather than silently ignoring navigation.

```tsx
import { TabList, Tab } from '@octane-xplat/ui'

const routeTabs = <TabList value="details" onChange={() => {}}>
	<Tab value="details" label="Details" to="/items/:id" params={{ id: 'coat' }} />
	<Tab value="activity" label="Activity" to="/items/:id"
		params={{ id: 'coat' }} search={{ tab: 'activity' }} matchSearch />
</TabList>
```

For a custom instance, pass `router={navigation}` with literal route names so
the component checks that instance's catalog. An opaque destination returned
by `validateDestination` can inherit its issuing router from the provider;
pass that whole value as `to`, without spreading or changing it.

```tsx
import { SideNavItem } from '@octane-xplat/ui'
import type { ValidatedDestination } from '@octane-xplat/ui/routing'

// Render inside the matching RouterProvider or route outlet.
export function SuggestedItem(props: { destination: ValidatedDestination }) {
	return <SideNavItem label="Open suggestion" to={props.destination} />
}
```

## Keep scroll and document metadata

A successful browser navigation starts at the top, or at its fragment target.
Back and Forward restore the position saved for that particular history entry,
even when two entries have the same URL. Opening or closing a modal preserves
the presenter's scroll position. Refresh leaves the current focus and scroll
alone; push and replace, including search updates, use the page-change behavior.

```ts
import { router } from '@octane-xplat/ui/routing'

await router.push({ to: '/items/:id', params: { id: 'coat' }, hash: 'history' })
await router.back()
await router.refresh()
```

After a page commits, the browser router focuses its main heading, or its main
landmark when there is no heading. An explicit HTML autofocus target takes
priority; without one of these targets, focus returns to the document body.
Give pages meaningful headings and controls stable DOM IDs so Back can restore
a control even when reloading the route replaces its node. Focus restoration
does not scroll away from the entry's saved position.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
// src/app/help.web.tsx
export default function Help() {
	return <main>
		<h1>Packing help</h1>
		<button id="packing-help-action">Start packing</button>
	</main>
}
```

These are browser document effects. A late cancelled loader cannot move focus,
scroll or metadata. Nested scroll containers and content that changes size after
commit need app-owned behavior. This does not establish native hash scrolling or
screen-reader input; native targets retain their platform focus policy.

```ts
// A new request supersedes unfinished work in the same flow.
const first = router.push({ to: '/items/:id', params: { id: 'coat' } })
await router.push({ to: '/items/:id', params: { id: 'hat' } })
const earlier = await first // May report cancelled; it cannot apply late effects.
```

### Retained native controls

Native route entries keep their own controls while retained. Back returns to
that entry's scroll position, and a modal keeps its presenter's viewport.
The router leaves native focus policy to the platform and your screen; it does
not apply the browser's heading or fragment behavior. Use a text control's
portable handle when an application action should focus it.

```tsx
import { useRef } from 'octane'
import { Button, ScrollableArea, Text, TextInput, View, type TextInputHandle } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'

export function NativeNotes() {
	const navigation = useRouter()
	const editor = useRef<TextInputHandle | null>(null)

	return <View>
		<Button clickAction={() => { void navigation.back() }}>Back</Button>
		<TextInput ref={editor} defaultValue="Trip notes" />
		<Button clickAction={() => editor.current?.focus()}>Edit notes</Button>
		<ScrollableArea height={200} label="Saved notes">
			<Text>{Array.from({ length: 50 }, (_, index) => `Note ${index + 1}`).join('\n')}</Text>
		</ScrollableArea>
	</View>
}
```

## Set the route title and metadata

A `head` export receives the prepared `params`, validated `search`, inherited
`context`, and awaited loader `data`. Use these values to compute metadata
synchronously; load asynchronous information in the loader. The browser applies
title and named metadata after commit. NativeScript Pages receive the title in
their action bar; the app decides whether that bar is visible. AppKit
document/window metadata integration is not implemented.

```tsx
// src/app/items/[id].tsrx, using the item loader above.
import type { RouteHeadArgs } from '../../routes.gen.contracts'

export const head = ({ params, search, data }: RouteHeadArgs<'/items/:id'>) => ({
	title: data.title + ' · My collection',
	meta: { description: 'Item ' + params.id + ' · ' + search.tab },
})
```

## Register routes from data

Use `defineRoute` to infer preparation, then attach the component with
`.screen(Guide)`. The screen is checked against that completed contract; it
cannot change the loader's inferred data. Register finished definitions in a
catalog. A configured manifest export receives the same generated registration
as file routes. Keep JSX screen components at module scope, as below; the current
native compiler does not lower inline JSX callbacks passed to `.screen`.

```tsx
// src/guide-routes.tsx
import { Text } from '@octane-xplat/ui'
import { defineRoute, defineRoutes, type RouteScreenProps } from '@octane-xplat/ui/routing/core'

const guide = defineRoute({
	path: '/guides/:slug',
	loader: ({ params }) => ({ title: params.slug }),
	head: ({ data }) => ({ title: data.title }),
})

function Guide(props: RouteScreenProps<typeof guide>) {
	return <Text>{props.params.slug + ': ' + props.data.title}</Text>
}

export const guideRoutes = defineRoutes({
	routes: [guide.screen(Guide)],
})
```

```json
{
	"directory": "src/app",
	"manifests": [{ "module": "./src/guide-routes.tsx", "export": "guideRoutes" }]
}
```

For search, guards and loading, write inline callbacks in dependency order:
validator, guard, then loader. TypeScript may give earlier callbacks unknown
inputs when their validator comes later. Move the validator first, or use a
separately declared parser. This paged version can replace the definition above.

```tsx
// src/guide-routes.tsx
import { Text } from '@octane-xplat/ui'
import { defineRoute, defineRoutes, type RouteScreenProps } from '@octane-xplat/ui/routing/core'

const pagedGuide = defineRoute({
	path: '/guides/:slug',
	validateSearch(raw: { page?: unknown }) {
		const page = Number(raw.page ?? 1)
		if (!Number.isInteger(page) || page < 1) throw new TypeError('Invalid page')

		return { page }
	},
	beforeLoad: ({ params }) => ({ section: params.slug }),
	loader: ({ search, context }) => ({ title: context.section, page: search.page }),
})

function Guide(props: RouteScreenProps<typeof pagedGuide>) {
	return <Text>{props.data.title + ' · Page ' + props.data.page}</Text>
}

export const guideRoutes = defineRoutes([pagedGuide.screen(Guide)])
```

The generator never executes route modules to discover types. Catalog
composition uses later definitions for the same pattern, with diagnostics for
shadowing. Programmatic layouts use directory keys such as `guides`.

```tsx
import { Text, View } from '@octane-xplat/ui'
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'

function GuideLayout(props: { children?: unknown }) {
	return <View><Text>Guides</Text>{props.children}</View>
}

function Help() { return <Text>Help</Text> }

export const otherGuides = defineRoutes({
	routes: [defineRoute({ path: '/guides/help' }).screen(Help)],
	layouts: { guides: GuideLayout },
})
```

### Keep reusable route paths literal

Let `defineRoutes` infer inline definitions. For a specification stored in a
variable, `as const satisfies RouteSpec` checks its fields and keeps its exact
path. A broad `: RouteSpec` annotation changes that path's type to `string`,
so the compiler can no longer build a finite destination union. The error now
explains how to retain the literal or choose runtime-only routes.

```ts
import { defineRoutes, type RouteSpec } from '@octane-xplat/ui/routing/core'

const help = { path: '/help', screen: () => null } as const satisfies RouteSpec

export const routes = defineRoutes([help])
```

## Own runtime registrations

Only finite literal patterns passed to `defineRoutes` become typed destination names.
Use `defineRuntimeRoutes` for paths computed from strings or open templates.
Runtime routes cannot weaken the required params or search fields of known routes. Prefer a declared
parameter pattern when many records share one screen:

```tsx
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'

export const articles = defineRoutes([
	defineRoute({ path: '/articles/:slug' }).screen(() => null),
])
// Every article uses the same checked destination:
// router.push({ to: '/articles/:slug', params: { slug: 'getting-started' } })
```

For paths supplied by data, build an explicitly runtime-only catalog. Root
context requirements still apply; its discovered names do not become typed
literals. Keep the returned catalog intact and author changes through the
builders, rather than mutating its definitions.

```ts
import { defineRoute, defineRuntimeRoutes } from '@octane-xplat/ui/routing/core'

export function contentRoutes(records: readonly { path: string; title: string }[]) {
	return defineRuntimeRoutes(records.map(record => defineRoute({
		path: record.path,
		loader: () => ({ title: record.title }),
	}).screen(() => null)))
}
```

Runtime plugins register on a router instance and receive a disposal handle.
Reusing an ID replaces that contribution; accidental collisions fail unless
replacement is explicit. Replacement applies to runtime layers. An instance's
declared contracts stay fixed: a plugin cannot replace one, even with
`conflict: 'replace'`. Compose declared overrides before creating the instance
so TypeScript infers the resulting contract. Reconfiguring the base catalog
retains nonconflicting plugin layers.

```ts
import { router } from '@octane-xplat/ui/routing'
import { guideRoutes } from './guide-routes'

const registration = router.addRoutes(guideRoutes, { id: 'guides', conflict: 'replace' })
// When this plugin is removed:
registration.dispose()
```

Aggregate reads such as `getSnapshot().route`, `useRouteMatch()`, and navigation
results can include runtime contributions. Check `contract === 'declared'`
before narrowing their route union. Runtime data stays `unknown`. A named
accessor checks the rendering entry and refuses a runtime route without a declared contract.

```tsx
import { Text } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'

const item = getRouteApi('/items/:id')

export function ItemTitle() {
	return <Text>{item.useLoaderData().title}</Text>
}
```

You can also narrow aggregate state explicitly. After the contract check, the
route pattern narrows its params, search, context and data together.

```ts
import { router } from '@octane-xplat/ui/routing'

const match = router.getSnapshot().route
if (match?.contract === 'declared' && match.to === '/items/:id') {
	const title: string = match.data.title
	console.log(title)
}
```

Runtime registration cannot widen an already compiled destination union. For
an unknown external or computed destination, validate and navigate through the
URL boundary. Unknown patterns are rejected rather than invented as routes.

```ts
import { router } from '@octane-xplat/ui/routing'

export async function openIncoming(url: string) {
	const result = await router.navigateUrl(url)
	if (result.status === 'not-found') console.warn('No screen at this address')

	return result
}
```

## Handle incoming links

Subscribe to the platform link producer after the route outlet mounts. Consume
the cold-launch URL once; subsequent events use the same validation, guards,
and loaders. Native URL-scheme registration belongs to the app's OS resources.

```tsx
import { useEffect } from 'octane'
import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import { router } from '@octane-xplat/ui/routing'

export function IncomingLinks() {
	useEffect(() => {
		const unsubscribe = onDeepLink(url => { void router.navigateUrl(url) })
		const initial = consumeInitialUrl()
		if (initial) void router.navigateUrl(initial)

		return unsubscribe
	}, [])

	return null
}
```

Generate addresses with the same destination contract. Static names, including
Unicode names such as `café`, and path values are encoded,
search has its own field, and an unknown pattern or undeclared stack fails
validation. Configure a route base separately from an asset base.

```ts
import { router } from '@octane-xplat/ui/routing'

const href = router.href({ to: '/items/:id', params: { id: 'winter coat' }, search: { tab: 'activity' } })
// /items/winter%20coat?tab=activity
```

### Register a custom scheme

Android and iOS must know which app owns the scheme before they can deliver
its URLs. Add an intent filter inside the main activity in
`App_Resources/Android/src/main/AndroidManifest.xml`, and URL types inside the
root dictionary of `App_Resources/iOS/Info.plist`, then rebuild and install.
HTTPS app/universal links also require domain association.

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="mycollection" />
</intent-filter>
```

```xml
<key>CFBundleURLTypes</key>
<array><dict><key>CFBundleURLSchemes</key><array><string>mycollection</string></array></dict></array>
```

### Reproduce launch and fallback behavior

Configure the same scheme in `xplat.routes.json` so the router accepts the OS
link. Add trusted HTTP(S) origins only when your app should treat them as internal
links. A scheme authority becomes the first path segment; an HTTPS authority
identifies the trusted origin. A route base is stripped once during matching.

```json
{
  "allowedSchemes": ["mycollection"],
  "allowedOrigins": ["https://collection.example"]
}
```

After regenerating routes, rebuild and install the native app. Run a link with
the app stopped, then repeat with it running. Each delivery should open the
item once. Opening the browser at `/items/coat` exercises direct CSR entry.

```sh
xcrun simctl openurl DEVICE_ID 'mycollection://items/coat'
adb -s DEVICE_ID shell am start -W -a android.intent.action.VIEW -d 'mycollection://items/coat' APP_ID
```

An unknown pattern returns `not-found`; malformed parameters or an unconfigured
scheme/origin return `invalid-input`. An unsuccessful link keeps committed
content. Show an explanation or deliberately navigate to a known fallback.
Guards run for direct entry and incoming links as well as typed navigation.

```ts
import { router } from '@octane-xplat/ui/routing'

export async function tryIncoming(url: string) {
	const result = await router.navigateUrl(url)
	if (result.status === 'not-found' || result.status === 'invalid-input') {
		return 'This link does not open a screen in this app.'
	}

	return null
}
```

## Bake route data at build time

A baked route ships its data in the bundle and needs no navigation-time fetch.
Place its build-time loader beside the screen. The generator runs that sibling
in Node; a type-only import describes its output without bundling Node code.

```ts
// app/changelog.loader.ts — executed by xplat routes, outside the app bundle.
import { readFileSync } from 'node:fs'

export function loader() {
	return { text: readFileSync(new URL('./changelog.txt', import.meta.url), 'utf8') }
}
```

```tsx
// app/changelog.tsrx
import { Text } from '@octane-xplat/ui'
import type { RouteProps } from '../routes.gen.contracts'

export const dataMode = 'baked'

export default function Changelog(props: RouteProps<'/changelog'>) {
	return <Text>{props.data.text}</Text>
}
```

Declare `dataMode` as a local constant literal so generation can choose the
build pipeline without importing your application. Local constant aliases and
`as const`/`satisfies` are accepted. Imported, mutable or computed modes fail
with the source file and a repair hint.

```ts
export const dataMode = 'baked' as const
```

Regenerate after editing the loader or its content. Baked loaders run once with
an empty params object and must return JSON data. Do not put a runtime loader
in the baked screen. For dynamic paths, bake a table and select its row from
`props.params`; baking does not run separately for each URL. Typechecking can
refresh contracts without executing loaders or replacing existing baked data.

```sh
pnpm exec xplat routes
pnpm exec xplat typecheck
```


The generated `data` type comes from the sibling's awaited return value,
including a default-exported loader. Its module is referenced through types
only. You can read that same inferred value from a matching screen with a
route accessor.

```tsx
import { Text } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'

const changelog = getRouteApi('/changelog')

export function ChangelogText() {
	const data = changelog.useLoaderData()

	return <Text>{data.text}</Text>
}
```

Baked output must contain plain JSON values. Generation names the source file
and field if a value would be dropped or changed, including `undefined`, array
holes, non-finite numbers, class instances, accessors and cycles. Convert dates
and other special values explicitly before returning them. Typechecking does
not refresh an old baked artifact; run the normal routes/dev/build workflow
after editing content.

```ts
// A build-time .loader.ts sibling: conversion keeps the transferred type exact.
export function loader() {
	return { publishedAt: new Date('2026-01-01T00:00:00Z').toISOString(), notes: [] }
}
```

Programmatic baked catalogs infer each route's data from the supplied `baked`
map. Its keys are normalized route names: `/guides/:slug` uses `guides/:slug`,
and `/` uses `index`. Configure this catalog as a manifest export, as in
[register routes from data](#register-routes-from-data), and regenerate. A missing
map or a map typed as `Record<string, unknown>` keeps the data unknown. Extra map
keys do not register routes, and map entries cannot replace a live loader's type.

```tsx
// src/guide-routes.tsx
import { Text, type Renderable } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'
import { defineRoutes } from '@octane-xplat/ui/routing/core'

const documents: Record<string, { title: string }> = {
	intro: { title: 'Your first trip' },
}

function BakedGuide(): Renderable {
	const route = getRouteApi('/guides/:slug')
	const document = route.useLoaderData()[route.useParams().slug]

	return <Text>{document?.title ?? 'Guide not found'}</Text>
}

export const guideRoutes = defineRoutes({
	routes: [{ path: '/guides/:slug', dataMode: 'baked', screen: BakedGuide }],
	baked: { 'guides/:slug': documents },
})
```

## Route a Markdown file

Place a Markdown file under the route directory. Generation parses it into a
baked document and supplies the shared Markdown screen on each target. This
needs no runtime Markdown parser or manual route registration.

```text
src/app/help.md        → /help
src/app/release.md     → /release
```

```md
<!-- src/app/help.md -->
# Packing help

Keep your travel checklist in one place.
```

## Hand the route list to a host

`routes.gen.manifest.json` describes normalized paths, source files, layouts,
and capability flags. It contains no executable loaders or rendering host.
A server integration needs reusable executable catalogs and request isolation
in addition to this description.

```sh
pnpm exec xplat routes
cat src/routes.gen.manifest.json
```

## Preserve providers across native Pages

Keep `RouteOutlet` below the providers it should inherit. Pushed Pages, retained
entries, and route modals stay owned by that source tree. Removing the outlet
cancels its pending work and releases the content it owns.

The v0.16.0 shared native JSX facade rejects Octane provider callables with
TS2786. This is a [declaration limitation](../../.agents/docs/notes/styled-jsx-contract.md#context-providers),
not evidence that route provider ownership fails at runtime. The example below
widens the provider to `any` for that reason.

```tsx
import './routes.gen'
import { createContext } from 'octane'
import { RouteOutlet, Text } from '@octane-xplat/ui'

const Account = createContext('Avery')
const Provider: any = Account

export function AccountApp() {
	return <Provider value="Avery"><RouteOutlet><Text>Home</Text></RouteOutlet></Provider>
}
```

A browser root outlet also owns its prepared history data. Removing it
releases current and saved matches, modal content, route metadata and owned
Back availability. The browser's URL history still exists. Remounting the
default root prepares its current URL again with fresh context and local
screen state, replacing that history item instead of pushing another one.
Application stores and data held outside the router remain application-owned.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'

export function OwnedRoutes(props: { visible: boolean }) {
	return props.visible
		? <RouteOutlet><Text>Choose a screen.</Text></RouteOutlet>
		: <Text>Routes closed.</Text>
}
```


To discard an owned screen tree, give its component a new `key`. Put every
outlet that should end together inside that component, including named panes.
The new native owner can navigate while the previous Frame is returning to its
base; the host waits for that restoration and any owned modal cleanup. Native
remounting returns to your declaring content rather than choosing a destination
for the application.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'

function OwnedScreens() {
	return <RouteOutlet><Text>Choose a screen.</Text></RouteOutlet>
}

export function App(props: { ownershipVersion: number }) {
	return <OwnedScreens key={props.ownershipVersion} />
}
```

## Validate a destination from data

Use `validateDestination()` when an API or plugin supplies a destination object.
It checks the pattern, path values, navigation options and search schema. Search
schemas may be asynchronous, so await the result. Validation leaves the current
screen and navigation pending state alone; it does not run guards or loaders.
URL strings go through `navigateUrl()` instead.

```ts
import { router } from '@octane-xplat/ui/routing'

export async function openSuggestion(value: unknown) {
	const checked = await router.validateDestination(value)
	if (checked.status !== 'valid') return checked

	return router.push(checked.destination)
}
// Example input:
// { to: '/items/:id', params: { id: 'coat' }, search: { tab: 'details' } }
```

The successful value is opaque: pass it intact to navigation, `href()`, or a
link's `to` prop. Choose options such as `presentation`, `transition`, and
`replace` in the object you validate. Copying or serializing the successful
value loses its validation proof. It belongs to the router instance that
created it.

```tsx
import { NavLink } from '@octane-xplat/ui'
import { router } from '@octane-xplat/ui/routing'
import type { ValidatedDestination } from '@octane-xplat/ui/routing'

export function SuggestedLink(props: { destination: ValidatedDestination }) {
	return <NavLink to={props.destination}>Open suggestion</NavLink>
}

export async function suggestionUrl(value: unknown) {
	const checked = await router.validateDestination(value)

	return checked.status === 'valid' ? router.href(checked.destination) : null
}
```

Navigation checks the current registry, search schema and guards again. A route
removed after validation returns `not-found`; a changed schema can return
`invalid-input`. The current screen stays visible. A retained checked link can
still render its URL after removal. An omitted stack follows the navigator
consuming the value, including a modal's inner flow. An explicit stack keeps
its selected target.

```ts
import { router } from '@octane-xplat/ui/routing'

const checked = await router.validateDestination({
	to: '/items/:id',
	params: { id: 'coat' },
	presentation: 'modal',
	transition: 'none',
})
if (checked.status === 'valid') {
	const result = await router.navigate(checked.destination)
	if (result.status === 'not-found') console.warn('This destination was removed')
}
```

For validation tied to an input or request, supply an abort signal. Aborting
validation, removing its registry snapshot or disposing its flow settles the
result as `cancelled`. Validation calls can run independently; they do not
supersede an unrelated navigation.

```ts
import { router } from '@octane-xplat/ui/routing'

export function checkSuggestion(value: unknown, signal: AbortSignal) {
	return router.validateDestination(value, { signal })
}
```

## Bind a custom router to rendering

For an embedded workspace, create a pane host and an explicit instance. Each
pane keeps its own Back history, retained screens and providers. This host
leaves browser URLs alone and does not allocate native Frames or modal surfaces.
Attach the same instance you created with its host; a host belongs to one
instance for its whole lifetime. Keep JSX components such as Help at module
scope; the factory creates each owner's state.

```tsx
// src/pane-navigation.tsx
import { Text } from '@octane-xplat/ui'
import {
	createPaneRouterHost, createRouter, defineRoute, defineRoutes,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing'

const help = defineRoute({
	path: '/help/:topic',
	loader: ({ params }) => ({ title: 'Help: ' + params.topic }),
})

function Help(props: RouteScreenProps<typeof help>) {
	return <Text>{props.data.title}</Text>
}

export function createPaneNavigation() {
	const host = createPaneRouterHost()
	const navigation = createRouter({
		catalog: defineRoutes([help.screen(Help)]),
		host: host.host,
		stacks: ['library', 'settings'],
	})
	host.attach(navigation)

	return { host, navigation, dispose: () => navigation.dispose() }
}
```

Mount each flow with `RouterPane`. It binds base content and routed screens to
that instance and stack. `RouterProvider` gives controls outside a pane the same
scope. Pass the explicit instance to typed hooks; its catalog and stack names
are inferred independently of generated default-client routes. The host
acknowledges rendering before navigation resolves, and nested layouts inherit
its owned outlet. Pane controls use their bound navigator; the enclosing host
owns OS Back and window-close integration.

```tsx
// src/PaneWorkspace.tsx
import { Button, Text, View } from '@octane-xplat/ui'
import { RouterPane, RouterProvider, useRouter } from '@octane-xplat/ui/routing'
import type { createPaneNavigation } from './pane-navigation'

type WorkspaceNavigation = ReturnType<typeof createPaneNavigation>

function Toolbar(props: { navigation: WorkspaceNavigation['navigation']; topic: string }) {
	const navigation = useRouter(props.navigation)

	return <View className="flex-row gap-2">
		<Button label="Open help" clickAction={() => {
			void navigation.push({ to: '/help/:topic', params: { topic: props.topic } })
		}} />
		<Button label="Back" clickAction={() => { void navigation.back() }} />
	</View>
}

export function PaneWorkspace(props: { workspace: WorkspaceNavigation }) {
	const { host, navigation } = props.workspace

	return <View className="flex-1">
		<RouterProvider router={navigation} stack="library">
			<Toolbar navigation={navigation} topic="library" />
		</RouterProvider>
		<RouterPane host={host} router={navigation} stack="library"><Text>Library base</Text></RouterPane>
		<RouterProvider router={navigation} stack="settings">
			<Toolbar navigation={navigation} topic="settings" />
		</RouterProvider>
		<RouterPane host={host} router={navigation} stack="settings"><Text>Settings base</Text></RouterPane>
	</View>
}
```

Create the workspace once for its app or window. Call its disposal function
when that owner closes. Removing one pane releases that flow's history without
disposing the instance used by another pane. A disposed host cannot be reused;
create a new host and instance for a new owner.

```tsx
// src/app.tsx
import { createPaneNavigation } from './pane-navigation'
import { PaneWorkspace } from './PaneWorkspace'

const workspace = createPaneNavigation()

export function App() { return <PaneWorkspace workspace={workspace} /> }
// Call from this app/window's close handler, after unmounting its root.
export function disposeApp() { workspace.dispose() }
```

Pane hosts skip unsupported effects while navigation commits. AppKit panes
can use the [AppKit transition helper](#animate-appkit-panes). Inspect the motion
result separately from navigation; routed modal requests return `unsupported`
with this host.

```ts
// src/pane-motion.ts
import type { createPaneNavigation } from './pane-navigation'

export async function openHelp(workspace: ReturnType<typeof createPaneNavigation>) {
	const result = await workspace.navigation.forStack('library').push({
		to: '/help/:topic', params: { topic: 'library' }, transition: 'fade',
	})

	return result.status === 'committed' ? (await result.finished).status : result.status
}
```

## Browser and server rendering

Browser startup uses client-side rendering (CSR): it prepares the current URL
once and renders it through the browser outlet. Route declarations do not turn
an app into a server-rendered site. The optional
[Web rendering host](../platform/web-rendering.md) prepares request-local HTML
and transfers explicit public data into browser startup.

```ts
// Client startup generated from xplat.routes.json:
import './routes.gen'

// For request-time HTML, use @octane-xplat/web-host/server with the catalog.
```

For native Frame debugging, read the [Frame lifecycle reference](../../.agents/skills/octane-xplat/references/navigation/native-frames.md).
For current commands and evidence, read [navigation checks](../../.agents/docs/navigation-checks.md).


## Open links on AppKit

Use Link for an external help URL. The AppKit leaf wraps plain text in a native
label and hands sanitized external URLs to the platform opener. Relative paths
still go through the canonical router; prefer NavLink when authoring app routes.
No extra native app window is created for an external link.

```tsx
import { Link } from '@octane-xplat/ui'

export function HelpLink() {
	return <Link href="https://example.com/help" isExternalLink>Read help</Link>
}
```

LinkProvider can supply a function component for a subtree, and a Link's `as`
prop takes precedence. A valid custom component receives the destination,
style/classes and onPress callback and owns navigation. Unsafe destinations
fall back to the native surface without invoking that component.

```tsx
import { Link, LinkProvider } from '@octane-xplat/ui'

function HelpSurface(props: { href: string; onPress?: () => void }) {
	return <Link href={props.href} as="a" onPress={props.onPress}>Open help</Link>
}

export function HelpLinks() {
	return <LinkProvider component={HelpSurface}>
		<Link href="https://example.com/help">Help</Link>
	</LinkProvider>
}
```

These paths have authored source cases, not a native verification run. AppKit
`target` does not select a browser tab/window, and custom intrinsic strings
other than the default `a` sentinel are not implemented. Tooltip presentation,
actual URL launch, keyboard/VoiceOver activation, inline wrapping and native
link appearance remain unqualified.
