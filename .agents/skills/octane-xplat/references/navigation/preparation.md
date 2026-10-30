# Prepare route inputs and feedback

Use for parent preparation, input validation, loaders, guards, and pending/error feedback. Begin with [route authoring](authoring.md) for the route definitions and generated contracts used here.

## Share parent preparation

Use `defineRouteGroup` for reusable parent lifecycles. Attach programmatic
children with `group.route(options).screen(Component)`; file routes explicitly
export the group as `group`. Nest with `group.group(options)`. Layout components
remain rendering wrappers. Each group's guard then loader runs before its
children, and loader output is inherited at `context[group.id]`. Root dependencies
remain separate from those additions. Groups rerun on every preparation, including
URL entry, Back and refresh; failures, redirects and cancellation stop children.
Group callbacks see general params/search because a group can serve several paths.

```ts
import { defineRouteGroup } from '@octane-xplat/ui/routing/core'
export const account = defineRouteGroup({ id: 'profile', loader: () => ({ name: 'Alex' }) })
export const project = account.group({ id: 'project', loader: ({ context }) => context.profile.name })
// In a file route: export { project as group } from '../route-groups'
```

## Handle inputs and preparation

The browser host prepares Back/Forward destinations with fresh guards, loaders
and one context snapshot for the restored background/modal entries. Imperative
Back refuses before moving history; browser-triggered denial keeps the current
screen and corrects its URL with a bounded wait. Retry preserves the refused
direction. Saved data is never authorization, including URLs revisited after
root-owner replacement. Same-flow rendered-pane Back also rechecks guards/loaders while retaining
local state. Programmatic Frame Back and Android OS Back also prepare retained
targets; redirected Frame content stages in a separate owned root before adoption.
A history redirect to another stack replaces its current entry and preserves the
source history; a modal redirect presents above the admitted source. Native modal
dismissal prepares and refreshes its presenter before closing; denial retains
the modal. Explicit `stack: 'root'` escapes a modal even when its logical stack is
root; an omitted stack inherits the current flow. Redirects reuse prepared data
within the same attempt. An iOS Frame leading-edge swipe requests canonical Back
after release; guards run before the pop. Short/cancelled/reversed drags do not
navigate. It has no finger-tracked preview. Built-in full-content pops are
disabled on owned Pages; this adapter does not add swipe Back to rendered panes
or add modal-dismissal gestures. Routed native modals are fullscreen with direct
SDK cancellation disabled. Close through canonical dismiss or Android OS Back;
forced host closure reconciles cleanup after closing.

```ts
const result = await router.back()
if (result.status === 'forbidden') { /* Show the application's sign-in action. */ }
// After the application's session changes: await router.retry()
```

Use typed `redirect` in guards or loaders. Use the route's own callback args
and root context dependencies instead of reading its own complete inferred
application registry during inference. A failed attempt returns a structured
result and leaves the committed screen visible; it does not inject an error
into otherwise successful screen props.

```tsx
// In the item route, with generated local inputs:
import { redirect } from '@octane-xplat/ui/routing'
import type { RouteGuardArgs } from '../../routes.gen.contracts'
export function beforeLoad({ params }: RouteGuardArgs<'/items/:id'>) {
	if (params.id === 'old') redirect({ to: '/items/:id', params: { id: 'coat' } })
	return { checked: true }
}
```

For programmatic baked specs, preserve the inferred `defineRoutes({ routes,
baked })` return. Accessors infer each DTO from the normalized route-name key
(`'/guides/:slug'` uses `'guides/:slug'`; root uses `'index'`). Missing or erased
map values remain unknown. Extra map keys do not widen destination unions, and
live routes keep their loader output. `defineRoute` is the live-loader helper;
a baked spec is supplied directly in the catalog's route list.

```ts
const catalog = defineRoutes({
	routes: [{ path: '/help', dataMode: 'baked', screen: Help }],
	baked: { help: { title: 'Packing help' } },
})
```

Head callbacks receive `{ params, search, context, data }` from the prepared
snapshot. Access path values through `params`; derive titles from awaited loader
data without another fetch. Keep callbacks synchronous. Programmatic head
callbacks follow the loader in dependency order for inference. File callbacks
use the generated local `RouteHeadArgs<Path>` type, including baked data and
parent context. Static head objects remain supported.

```ts
import { defineRoute } from '@octane-xplat/ui/routing/core'
const item = defineRoute({
	path: '/items/:id',
	loader: ({ params }) => ({ title: params.id }),
	head: ({ data }) => ({ title: data.title }),
})
```

```ts
import type { RouteHeadArgs } from '../../routes.gen.contracts'
export function head({ data }: RouteHeadArgs<'/items/:id'>) {
	return { title: data.title }
}
```

For current-screen filters, bind `getRouteApi(path, instance?).useUpdateSearch()`
inside the screen. A synchronous pure callback receives validated search output
and returns the whole navigation search input. Omit fields to remove them;
preservation is explicit. It replaces by default; `replace:false` pushes.
Guards/loaders rerun, the fragment is preserved, and ordinary host scroll rules
apply. A retained inactive entry's stale callback returns `cancelled` without
invoking the function. Use the returned callback in that screen's handlers.

```tsx
import { Button } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'
const item = getRouteApi('/items/:id')
export function ItemFilters() {
	const updateSearch = item.useUpdateSearch()
	return <Button label="Activity" clickAction={() => {
		void updateSearch(previous => ({ ...previous, tab: 'activity' }))
	}} />
}
```

Treat unknown URLs as runtime inputs. `navigateUrl` validates them through the
same pipeline. Unknown patterns, unavailable screens, malformed input,
resource-not-found, forbidden, cancellation, and failures remain distinguishable.
Never recover typing by asserting a computed object to a destination union.

```ts
import { router } from '@octane-xplat/ui/routing'
export async function openIncoming(url: string) {
	return router.navigateUrl(url)
}
```

For destination objects from data, await `validateDestination`. It runs path,
option and search/schema checks without context, guards or loading. Pass the
original opaque result to navigation/href, or as `<NavLink to={value}>`.
Choose route options before validation. Do not spread or serialize the opaque
value or pass it to a different instance. Omitted stacks follow the consuming
navigator; navigation rechecks the current registry and guards. Removed or
changed routes cannot use an old proof to bypass preparation. `resolveUrl` is
only a synchronous syntactic match, not the async schema proof.

```tsx
import { NavLink } from '@octane-xplat/ui'
import { router } from '@octane-xplat/ui/routing'
import type { ValidatedDestination } from '@octane-xplat/ui/routing'
export async function openFromData(value: unknown) {
	const checked = await router.validateDestination(value)
	if (checked.status === 'valid') return router.push(checked.destination)
	return checked
}
export function CheckedLink(props: { destination: ValidatedDestination }) {
	return <NavLink to={props.destination}>Open</NavLink>
}
```

## Show navigation feedback

`useNavigation()` returns one flow's `idle`, `pending`, or `failed` state,
including the attempted action and readonly URL inputs. It exposes no route
DTO, so shared status components can inherit custom providers without an
instance prop. Typed `useRouterState()`, `useRouteMatch()`, `useRouter()` and
route-specific accessors require that explicit instance under custom providers.

```tsx
import { Text } from '@octane-xplat/ui'
import { useNavigation } from '@octane-xplat/ui/routing'
function LoadingStatus() {
	return <Text>{useNavigation().status === 'pending' ? 'Opening…' : ''}</Text>
}
```

Failed preparation retains the committed screen. A flow's retry repeats its
latest failed request, including missing/forbidden/invalid destinations;
successful commit or `clearFailure()` clears feedback. A cancelled retry can
reveal the previous failure again. Keep errors local and distinguish expected
missing/forbidden outcomes from unexpected loader/render failures.

```ts
const state = navigation.getSnapshot().navigation
if (state.status === 'failed') await navigation.retry()
navigation.clearFailure()
```
