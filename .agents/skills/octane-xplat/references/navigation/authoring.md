# Author and type routes

Start here when defining route modules, generated inputs, platform contracts, or typed composition. The [navigation index](../navigation.md) owns shell/outlet setup.

## Author routes and infer inputs

Generation parses route syntax without evaluating modules. Use explicit named
exports/re-exports for callbacks; `export *` is rejected because it hides runtime
capabilities. Declare `dataMode` as a local const literal (`'baked'` or `'live'`),
optionally through local const aliases, `as const` or `satisfies`. Imported,
mutable and computed modes fail instead of silently selecting another pipeline.
Unchanged generated files retain their timestamps. `xplat dev` watches an app-owned
route directory; `xplat routes --watch` works with a separate dev server. A shared
workspace package owns its watcher independently of the platform shells.
Web CLI and agent discovery recognize `vite.config.{js,mjs,cjs,ts,mts,cts}`;
do not rename a JavaScript config merely to enable `xplat dev web`.
Watch configuration/module/source repairs recover without restart, and deleting
and recreating the conventional route tree clears/restores its contract union.
Keep `out` fixed while watching; moving it requires stopping, regenerating,
updating client/type imports and removing obsolete generated entries. Arbitrary
loader filesystem inputs outside the watched trees still need explicit regeneration.

```ts
export const dataMode = 'baked' as const
export { Changelog as default } from '../screens/changelog'
```

```sh
pnpm exec xplat routes --watch
# Repository harness: one shared watcher alongside platform dev servers.
pnpm --filter @xplat/app routes:watch
```

The repository's live browser watcher check covers route edits/additions/renames/
removals and configured context/manifests without restarting Vite. Document reloads
occur; retained HMR state and native/device HMR remain separate qualifications.
The TSX fixture currently emits the documented nonfatal JSX dependency-scan warning.

```sh
pnpm --filter @xplat/web smoke:routing-watch
```


File routes export a screen plus optional `validateSearch`, `beforeLoad`,
`loader`, `head`, and `ErrorBoundary`. Import generated local `.contracts`
types inside that route. Path, validated search, guard context, and loader data
remain separate; no `_stack`, flattened parameter bag, or injected close callback.
Malformed callback exports are compiler errors in generated `RouteExportChecks`
and fatal `route/invalid-export` errors when the route module is loaded. Repair the
source export; never cast generated checks away. Invalid guards are not ignored.
Guard callbacks return an added context object or void; parsers return a search
object, with async equivalents. Returning boolean permission flags or scalar
search output is a type error in file routes, as it is in programmatic routes.
Named output interfaces need no index signature, including async parsers and
Standard Schema. Return plain field objects; non-record JavaScript results fail
before guards/loaders. Preserve validator return literals with `as const` or an explicit return type;
a widened `string` output also widens navigation's admitted search values.

```tsx
// src/app/items/[id].tsrx
import { Text } from '@octane-xplat/ui'
import type { RouteLoaderArgs, RouteProps } from '../../routes.gen.contracts'

export function validateSearch(raw: { tab?: unknown }) {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details' && tab !== 'activity') throw new TypeError('Invalid tab')
	return { tab } as const
}
export function loader({ params, search }: RouteLoaderArgs<'/items/:id'>) {
	return { title: params.id, tab: search.tab }
}
export function screen(props: RouteProps<'/items/:id'>) {
	return <Text>{props.data.title}</Text>
}
```

URL validation always starts with strings or repeated-key arrays. A schema
requiring number/boolean input must use `withSearchDecoder`; bare incompatible
schemas and parser parameter types fail programmatic and generated checks.
Keep the decoder pure and let the schema reject invalid values. Navigation
retains the schema's input types; typed objects and direct URLs share decoding.
Only scalar fields and arrays of scalars can be encoded in destinations.

```ts
import { withSearchDecoder } from '@octane-xplat/ui/routing/core'
import { pageSchema } from './schemas'
export const validateSearch = withSearchDecoder(pageSchema, raw => ({
	page: raw.page === undefined ? undefined : Number(raw.page),
}))
```

Programmatic definitions infer preparation with `defineRoute(options)`, then
attach a module-level component with `.screen(component)` before `defineRoutes`.
The flat `screen` option is removed; do not add a compatibility overload or cast
an unfinished builder into a catalog. Keep inline validators, guards and loaders
in dependency order; a named parser value preserves its known type across field
order. Configure manifest
exports for generated registration; application authors never handwrite an
augmentation. Generated `.catalog.<target>` and `.contracts` imports stay local;
`.types` and client imports deliberately contribute application contracts.
Inline JSX screen callbacks are not lowered by the installed universal compiler;
use a module-level named function or arrow binding for shared/native views.
Typechecking such a callback alone does not establish native build support.

```tsx
import { Text } from '@octane-xplat/ui'
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
function Guide(props: { data: { title: string; page: number } }) { return <Text>{props.data.title}</Text> }
export const guideRoutes = defineRoutes([
	defineRoute({
		path: '/guides/:slug',
		validateSearch(raw: { page?: unknown }) {
			const page = Number(raw.page ?? 1)
			if (!Number.isInteger(page) || page < 1) throw new TypeError('Invalid page')
			return { page }
		},
		beforeLoad: ({ params }) => ({ section: params.slug }),
		loader: ({ search, context }) => ({ title: context.section, page: search.page }),
	}).screen(Guide),
])
```

```json
{
	"directory": "src/app",
	"manifests": [{ "module": "./src/guides.tsx", "export": "guideRoutes" }],
	"stacks": ["library", "settings"]
}
```

## Keep platform contracts truthful

File discovery recognizes `.tsx`, `.tsrx` and `.md`, not plain `.ts`/`.js`
helpers. Platform variants must preserve compatible params, search input/output,
context and loader data; generated `.contracts` checks compare both directions.
The default facade, hook, redirects and links only accept routes available on
all generated targets. A platform-only destination uses the existing async
validation proof; do not cast it into the shared destination union.

```ts
import { router } from '@octane-xplat/ui/routing'
const camera = await router.validateDestination({ to: '/camera' })
if (camera.status === 'valid') await router.push(camera.destination)
```

Explicit instances infer only their generated target catalog's paths. A missing
screen retains metadata and reports `not-found/unavailable`, separately from
unknown patterns and host readiness. `.web` also serves Linux WebKit; `.mobile`
serves iOS/Android/generic mobile. See the [platform guidance](../../../../../docs/app/navigation.md#share-routes-across-targets)
before choosing a target-specific custom host.

```ts
import { routes } from './routes.gen.catalog.web'
import { createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
export function createWebNavigation(host: RouterHost) {
	return createRouter({ catalog: routes, host })
}
```

## Compose typed navigation

Use `to`/`params`/`search` directly on sidebar, top-bar, heading-menu,
breadcrumb, menu-link, navigation-strip and navigation-tab items. Their arrays
accept readonly values; use `as const satisfies readonly BreadcrumbItem[]`
(or the corresponding item type) when storing them separately. `href` is the
raw URL alternative; actions omit both. Literal destinations under a custom
provider require `router={instance}`. An opaque checked destination may inherit
its issuing instance from that provider; pass the entire value as `to`.

```tsx
import { SideNavItem, DropdownMenu, TabList, Tab } from '@octane-xplat/ui'

const item = <SideNavItem label="Coat" to="/items/:id" params={{ id: 'coat' }} />
const menu = <DropdownMenu button={{ label: 'Items' }} items={[
	{ type: 'link', key: 'coat', label: 'Coat', to: '/items/:id', params: { id: 'coat' } },
]} />
const tabs = <TabList value="coat" onChange={() => {}}>
	<Tab value="coat" label="Coat" to="/items/:id" params={{ id: 'coat' }} />
</TabList>
```

Typed navigation tabs use the navigation pattern. `role="tablist"` controls
local panels and rejects `to`; `TabMenu` also remains a local selection menu.
Use a routing `DropdownMenu` for overflow destinations. Web typed items retain
real hrefs, modifiers and target/download behavior; native activation uses the
owner's flow. Callback `preventDefault()` cancels activation and menu closing.

```tsx
import { SideNavItem } from '@octane-xplat/ui'

const paused = <SideNavItem label="Coat" to="/items/:id" params={{ id: 'coat' }}
	onClick={event => event.preventDefault()} />
```
