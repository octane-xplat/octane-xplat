import {
	defineRoute,
	defineRoutes,
	type ContractRouteManifest,
} from '@octane-xplat/ui/routing/core'

import { startWebApp } from '../src/client.web'
import { createWebHandler, createWebRenderer } from '../src/server.web'
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

const renderer = createWebRenderer({
	catalog,
	buildId: 'test',
	assets: { scripts: [] },
	context: () => ({ viewer: 'public' }),
	transfer: () => ({ data: null, context: {} }),
})

renderer.href({ to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Static paths retain required route parameters.
renderer.href({ to: '/items/:id' })
import { prerender } from '../src/build/prerender'
void prerender(renderer, {
	origin: 'https://example.com',
	outDir: 'dist/static',
	revision: 'v1',
	paths: [{ destination: { to: '/items/:id', params: { id: 'coat' } }, key: 'v1' }],
})

void prerender(renderer, {
	origin: 'https://example.com',
	outDir: 'dist/static',
	revision: 'v1',
	// @ts-expect-error Enumeration cannot widen the catalog's destinations.
	paths: [{ destination: { to: '/unknown' }, key: 'v1' }],
})
