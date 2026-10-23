import {
	defineRoute,
	defineRoutes,
	type ContractRouteManifest,
} from '@octane-xplat/ui/routing/core'

import { startWebApp } from '../src/client.web'
import { createWebHandler } from '../src/server.web'
const route = defineRoute.withContext<{ viewer: string }>()
const catalog = defineRoutes([
	route({ path: '/items/:id', loader: ({ context }) => ({ name: context.viewer }) }).screen(
		() => null,
	),
])

const app = startWebApp({ catalog, buildId: 'test', context: { viewer: 'browser' } })
app.then(({ router }) => {
	void router.push({ to: '/items/:id', params: { id: 'coat' } })
	// @ts-expect-error Unknown routes cannot enter through the web host.
	void router.push({ to: '/unknown' })
	// @ts-expect-error Declared path parameters remain required.
	void router.push({ to: '/items/:id' })
})

// @ts-expect-error The client must supply the catalog's root services.
void startWebApp({ catalog, buildId: 'test' })
const erased: ContractRouteManifest = catalog
// @ts-expect-error Do not erase the route contracts at the public boundary.
void startWebApp({ catalog: erased, buildId: 'test', context: {} })
createWebHandler({
	catalog,
	buildId: 'test',
	assets: { scripts: [] },
	context: () => ({ viewer: 'server' }),
	transfer: () => ({ data: null, context: {} }),
})

// @ts-expect-error Server context must satisfy the catalog's root services.
createWebHandler({
	catalog,
	buildId: 'test',
	assets: { scripts: [] },
	transfer: () => ({ data: null, context: {} }),
})
