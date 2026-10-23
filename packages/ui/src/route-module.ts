import type { RouteMeta } from './props'

type ModuleLoader = NonNullable<RouteMeta['loadModule']>
type RouteModule = Awaited<ReturnType<ModuleLoader>>
// Loader identity survives catalog snapshots. Only module definitions are shared;
// cancellation belongs to each waiter, not to the underlying dynamic import.
const modules = new WeakMap<ModuleLoader, RouteModule>()
const pending = new WeakMap<ModuleLoader, Promise<void>>()

export function loadRouteModule(meta: RouteMeta): Promise<void> {
	const load = meta.loadModule
	if (!load || modules.has(load)) {
		return Promise.resolve()
	}
	let work = pending.get(load)
	if (!work) {
		work = Promise.resolve()
			.then(load)
			.then((value) => {
				modules.set(load, value)
			})
			.finally(() => {
				// Rejected loads may be retried; concurrent callers share this attempt.
				pending.delete(load)
			})

		pending.set(load, work)
	}
	return work
}

export function loadedRouteModule(meta: RouteMeta): RouteModule | undefined {
	return meta.loadModule ? modules.get(meta.loadModule) : undefined
}

export function loadedRouteMeta(meta: RouteMeta): RouteMeta {
	const loaded = loadedRouteModule(meta)
	// Preserve catalog-owned identity/availability while adopting module callbacks.
	return loaded ? { ...meta, ...loaded.meta, platforms: meta.platforms } : meta
}
