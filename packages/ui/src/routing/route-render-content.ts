import { loadedRouteMeta, loadedRouteModule } from './route-module'
import { layoutChain } from './route-table'
import type { PreparedRouteMatch, RouteManifest, RouterHostContent } from '../props'

/** Resolve against the same instance registry that prepared the match. Hosts
 * must not consult a process-global screen table after async preparation. */
export function routeRenderContent(
	catalog: RouteManifest,
	match: PreparedRouteMatch,
): RouterHostContent {
	const registered = catalog.routes.find((route) => route.name === match.name)
	if (registered?.loadModule && !loadedRouteModule(registered)) {
		throw new Error('Prepared route module has not been loaded')
	}
	const meta = registered ? loadedRouteMeta(registered) : undefined
	const screen =
		(registered && loadedRouteModule(registered)?.screen) ??
		(Object.hasOwn(catalog.screens, match.name) ? catalog.screens[match.name] : undefined)
	if (!screen) {
		throw new Error('Prepared route has no registered screen')
	}
	const props = {
		params: match.params,
		search: match.search,
		context: match.context,
		data: match.data,
	}
	return {
		screen,
		layouts: layoutChain(catalog.layouts, match.name),
		boundary: meta?.errorBoundary,
		head: typeof meta?.head === 'function' ? meta.head(props) : meta?.head,
		props,
	}
}
