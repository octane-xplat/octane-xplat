import type { RouteManifest, RouteMeta, RouteCatalog } from './props'

// Contract evidence belongs to executable definitions, never serialized metadata
// or a copied type-only brand. Internal snapshots explicitly retain it.
const declared = new WeakSet<RouteMeta>()
const definitions = new WeakSet<object>()
const catalogs = new WeakSet<RouteManifest>()

export function isSealedRouteCatalog(catalog: RouteManifest): boolean {
	return catalogs.has(catalog)
}

export function rememberRouteDefinition<Definition extends object>(
	definition: Definition,
): Definition {
	definitions.add(definition)
	return Object.freeze(definition)
}

export function isRouteDefinition(definition: object): boolean {
	return definitions.has(definition)
}

export function hasRouteContract(route: RouteMeta): boolean {
	return declared.has(route)
}

export function declareRouteContract(route: RouteMeta): void {
	declared.add(route)
}

export function copyRouteContract(source: RouteMeta, target: RouteMeta): RouteMeta {
	if (declared.has(source)) {
		declared.add(target)
	}
	return target
}

/** Generated modules call this only after installing their build-time data. */
export function sealGeneratedRouteCatalog<Contracts>(
	catalog: RouteManifest,
	metadata?: readonly RouteMeta[],
): RouteCatalog<Contracts> {
	const remaining = new Map(metadata?.map((route) => [route.name, route]))
	const routes = catalog.routes.map((route) => {
		const source = remaining.get(route.name)
		remaining.delete(route.name)
		return source?.platforms
			? copyRouteContract(route, { ...route, platforms: [...source.platforms] })
			: route
	})
	for (const source of remaining.values()) {
		// Retain the pattern without importing or inventing its missing screen.
		routes.push({
			...source,
			segments: [...source.segments],
			params: [...source.params],
			...(source.platforms ? { platforms: [...source.platforms] } : {}),
		})
	}
	const complete = metadata ? { ...catalog, routes } : catalog
	for (const route of complete.routes) {
		declareRouteContract(route)
	}
	return sealRouteCatalog(complete) as RouteCatalog<Contracts>
}

export function sealRouteCatalog<Catalog extends RouteManifest>(catalog: Catalog): Catalog {
	for (const route of catalog.routes) {
		Object.freeze(route.segments)
		Object.freeze(route.params)
		if (route.platforms) {
			Object.freeze(route.platforms)
		}

		if (route.preparation) {
			Object.freeze(route.preparation)
		}

		Object.freeze(route)
	}
	Object.freeze(catalog.routes)
	Object.freeze(catalog.screens)
	Object.freeze(catalog.layouts)
	if (catalog.loaders) {
		Object.freeze(catalog.loaders)
	}
	if (catalog.baked) {
		Object.freeze(catalog.baked)
	}
	catalogs.add(catalog)
	return Object.freeze(catalog)
}
