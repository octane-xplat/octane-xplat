import {
	copyRouteContract,
	hasRouteContract,
	isSealedRouteCatalog,
	sealRouteCatalog,
} from './route-contract-scope'

import { composeRouteCatalogs } from './route-table'
import type { RouteManifest, RouteRegistration, RouteRegistrationOptions } from '../props'

/** Snapshot definitions, never the mutable request context or prepared data. */
export function snapshotRouteCatalog(catalog: RouteManifest): RouteManifest {
	const contracted = isSealedRouteCatalog(catalog)
	const snapshot = {
		...catalog,
		screens: { ...catalog.screens },
		routes: catalog.routes.map((route) => {
			const next = {
				...route,
				segments: [...route.segments],
				params: [...route.params],
				preparation: route.preparation ? { ...route.preparation } : undefined,
			}
			return contracted ? copyRouteContract(route, next) : next
		}),
		loaders: { ...catalog.loaders },
		layouts: { ...catalog.layouts },
		baked: catalog.baked ? { ...catalog.baked } : undefined,
	}
	return contracted ? sealRouteCatalog(snapshot) : snapshot
}

export class RouteRegistrationError extends Error {
	readonly registration: string
	readonly key: string
	constructor(registration: string, key: string) {
		super(`Route registration '${registration}' conflicts at '${key}'`)
		this.name = 'RouteRegistrationError'
		this.registration = registration
		this.key = key
	}
}

/** Instance-local contributions. A replaced handle cannot remove its successor. */
export function createRouteRegistry(
	base: RouteManifest,
	changed: (catalog: RouteManifest) => void,
) {
	type Layer = {
		catalog: RouteManifest
		policy: 'error' | 'replace'
		token: object
	}
	const layers = new Map<string, Layer>()
	let initial = snapshotRouteCatalog(base)
	let disposed = false
	const assemble = (candidates: Map<string, Layer>, baseCatalog = initial) => {
		const names = new Map<string, string>()
		const paths = new Map<string, string>()
		const catalogs = [
			{ id: 'base', catalog: baseCatalog, policy: 'replace' },
			...[...candidates].map(([id, layer]) => ({ id, ...layer })),
		]
		const declaredPaths = new Set(
			baseCatalog.routes.filter(hasRouteContract).map((route) => '/' + route.segments.join('/')),
		)
		const declaredNames = new Set(
			baseCatalog.routes.filter(hasRouteContract).map((route) => route.name),
		)
		for (const { id, catalog } of catalogs.slice(1)) {
			for (const route of catalog.routes) {
				const path = '/' + route.segments.join('/')
				if (declaredPaths.has(path) || declaredNames.has(route.name)) {
					throw new RouteRegistrationError(id, `declared:${path}`)
				}
			}
		}
		for (const { catalog } of catalogs) {
			for (const route of catalog.routes) {
				const path = '/' + route.segments.join('/')
				const oldPath = names.get(route.name)
				const oldName = paths.get(path)
				if (oldPath !== undefined) {
					paths.delete(oldPath)
				}

				if (oldName !== undefined) {
					names.delete(oldName)
				}

				names.set(route.name, path)
				paths.set(path, route.name)
			}
		}
		// Remove shadowed definitions before composing, including aliases of the
		// same public pattern. Precedence is deliberate, so no shadow warning.
		const remaining = new Set(names.keys())
		const filtered: RouteManifest[] = []
		for (const { catalog } of [...catalogs].reverse()) {
			const routes = catalog.routes.filter((route) => {
				if (
					!remaining.has(route.name) ||
					names.get(route.name) !== '/' + route.segments.join('/')
				) {
					return false
				}
				remaining.delete(route.name)
				return true
			})

			const screens = { ...catalog.screens }
			const baked = { ...catalog.baked }
			const selected = new Set(routes.map((route) => route.name))
			for (const route of catalog.routes) {
				if (!selected.has(route.name)) {
					delete screens[route.name]
					delete baked[route.name]
				}
			}

			filtered.unshift({ ...catalog, routes, screens, baked })
		}
		return composeRouteCatalogs(filtered, false)
	}
	return {
		replaceBase(catalog: RouteManifest): void {
			if (disposed) {
				throw new Error('Router instance is disposed')
			}
			const next = snapshotRouteCatalog(catalog)
			const merged = assemble(layers, next)
			initial = next
			changed(merged)
		},
		add(catalog: RouteManifest, options: RouteRegistrationOptions): RouteRegistration {
			if (disposed) {
				throw new Error('Router instance is disposed')
			}
			if (typeof options.id !== 'string' || !options.id.trim()) {
				throw new TypeError('Route registration requires a nonempty id')
			}
			if (options.conflict !== undefined && !['error', 'replace'].includes(options.conflict)) {
				throw new TypeError('Unknown route registration conflict policy')
			}
			const layer: Layer = {
				catalog: snapshotRouteCatalog(catalog),
				policy: options.conflict ?? 'error',
				token: {},
			}
			if (layer.policy === 'error') {
				const others = new Map(layers)
				others.delete(options.id)
				const existing = assemble(others)
				const paths = new Set(existing.routes.map((route) => '/' + route.segments.join('/')))
				for (const route of layer.catalog.routes) {
					const path = '/' + route.segments.join('/')
					if (paths.has(path)) {
						throw new RouteRegistrationError(options.id, path)
					}
				}

				for (const name of Object.keys(layer.catalog.screens)) {
					if (Object.hasOwn(existing.screens, name)) {
						throw new RouteRegistrationError(options.id, name)
					}
				}

				for (const key of Object.keys(layer.catalog.layouts)) {
					if (Object.hasOwn(existing.layouts, key)) {
						throw new RouteRegistrationError(options.id, `layout:${key || '/'}`)
					}
				}
			}
			const next = new Map(layers).set(options.id, layer)
			const merged = assemble(next) // Validate atomically, before touching live state.
			layers.set(options.id, layer)
			changed(merged)
			return {
				dispose() {
					if (disposed || layers.get(options.id)?.token !== layer.token) {
						return
					}
					const next = new Map(layers)
					next.delete(options.id)
					const merged = assemble(next)
					layers.delete(options.id)
					changed(merged)
				},
			}
		},
		dispose(): void {
			disposed = true
			layers.clear()
		},
	}
}
