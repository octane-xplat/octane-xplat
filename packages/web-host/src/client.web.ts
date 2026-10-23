import { createRoot, hydrateRoot, flushSync } from 'octane'
import {
	createRoutePreparation,
	createRouter,
	type PreparedRouteMatch,
	type ContractRouteManifest,
	type ContractsOf,
	type RouterInstance,
} from '@octane-xplat/ui/routing/core'

import {
	createBrowserRouterHost,
	routeRenderContent,
	WebRouterRoot,
} from '@octane-xplat/ui/routing/web-host'

import { bootstrapId, rootId, identifierPrefix, serializePublic } from './transfer'
import type { WebBootstrap, WebClientOptions } from './props'

export type { WebClientOptions, WebAppProps } from './props'

/** One document, one router. Stale/mismatched documents fail before any browser
 * history or DOM mutation; a host can offer a reload instead of using old data. */
export async function startWebApp<const Catalog extends ContractRouteManifest>(
	options: WebClientOptions<Catalog>,
) {
	const script = document.getElementById(bootstrapId)
	const container = document.getElementById(rootId)
	if (!script || script.tagName !== 'SCRIPT' || !container) {
		throw new Error('Missing Xplat document bootstrap or app container')
	}
	const payload = JSON.parse(script.textContent ?? '') as WebBootstrap
	serializePublic(payload)
	if (
		payload.version !== 1 ||
		payload.buildId !== options.buildId ||
		payload.url !== location.pathname + location.search ||
		!['server', 'client'].includes(payload.mode)
	) {
		throw new Error('Xplat document does not match this URL or client build; reload the page')
	}
	let match: PreparedRouteMatch | undefined
	if (payload.mode === 'server') {
		const candidate = payload.match
		if (
			!candidate ||
			!candidate.context ||
			typeof candidate.context !== 'object' ||
			Array.isArray(candidate.context) ||
			!Object.hasOwn(candidate, 'data')
		) {
			throw new Error('Invalid prepared document route')
		}

		const engine = createRoutePreparation({
			catalog: options.catalog,
			base: options.base,
			stacks: options.stacks,
		})

		try {
			const resolved = engine.resolveUrl(payload.url)
			if (
				resolved.status !== 'matched' ||
				resolved.destination.to !== candidate.to ||
				(resolved.destination.stack ?? 'root') !== candidate.stack ||
				resolved.href !== candidate.href ||
				serializePublic(resolved.destination.params ?? {}) !== serializePublic(candidate.params) ||
				resolved.name !== candidate.name
			) {
				throw new Error('Prepared document route does not match the catalog')
			}
		} finally {
			engine.dispose()
		}

		match = candidate
	}
	const platform = createBrowserRouterHost()
	const router = createRouter({
		catalog: options.catalog,
		host: platform.host,
		context: options.context ?? {},
		base: options.base,
		stacks: options.stacks,
		createCancellationController: () => new AbortController(),
	} as never) as RouterInstance<ContractsOf<Catalog>, string>
	platform.attach(router)
	try {
		if (match) {
			platform.initialize(match, routeRenderContent(options.catalog, match))
		}

		const props = { host: platform, router, App: options.App }
		const root = match
			? hydrateRoot(container, WebRouterRoot, props, {
					identifierPrefix,
					onRecoverableError: options.onRecoverableError,
				})
			: createRoot(container, { identifierPrefix })

		if (!match) {
			flushSync(() => root.render(WebRouterRoot, props))
		}

		script.remove()
		if (!match) {
			const result = await router.navigateUrl(location.pathname + location.search + location.hash, {
				replace: true,
			})

			if (result.status !== 'committed') {
				root.unmount()
				throw new Error(`Initial client navigation failed: ${result.status}`)
			}
		}

		return {
			router,
			root,
			dispose() {
				root.unmount()
				router.dispose()
			},
		}
	} catch (error) {
		router.dispose()
		throw error
	}
}
