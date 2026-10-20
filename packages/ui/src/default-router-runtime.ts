import { isSealedRouteCatalog } from './route-contract-scope'
import {
	bindRouterFacade,
	createRouter,
	replaceRouterBaseCatalog,
	replaceRouterTransitions,
} from './router-instance'

import { defineTransitions } from './route-transitions'
import { snapshotRouteCatalog } from './route-registry'
import { createStore } from './store'
import type {
	ClientRouterHost,
	RegisteredRouteContracts,
	RouteManifest,
	RouterConfiguration,
	RouteCatalog,
	RouterInstance,
} from './props'

/** Lazy, document/app-local client ownership. Server requests use explicit
 * instances and never install themselves as the default client. */
export function createDefaultRouterRuntime<Platform extends ClientRouterHost>(
	createPlatform: () => Platform,
) {
	const configured = createStore(false)
	let configuration: RouterConfiguration<RouteManifest, string> | undefined
	let client: { platform: Platform; instance: RouterInstance<RegisteredRouteContracts> } | undefined
	const getClient = () => {
		if (client) {
			return client
		}
		if (!configuration) {
			throw new Error('Configure routes before using the default client router')
		}
		const platform = createPlatform()
		try {
			// Generated registration supplies the contract map. The lazy facade keeps
			// that application-wide type without evaluating route modules for types.
			const instance = createRouter({
				// Concrete contracts and context were checked by public configuration.
				catalog: configuration.catalog as RouteCatalog<{}>,
				host: platform.host,
				base: configuration.base,
				allowedSchemes: configuration.allowedSchemes,
				allowedOrigins: configuration.allowedOrigins,
				stacks: configuration.stacks,
				transitions: configuration.transitions,
				context: () => {
					const context = configuration!.context
					return typeof context === 'function' ? context() : (context ?? {})
				},
				createCancellationController: configuration.createCancellationController,
				onSubscriberError: configuration.onSubscriberError,
			}) as unknown as RouterInstance<RegisteredRouteContracts>

			client = { platform, instance }
			platform.attach(router)
			return client
		} catch (error) {
			if (client) {
				const failed = client
				client = undefined
				failed.instance.dispose()
			} else {
				platform.host.dispose?.()
			}

			throw error
		}
	}
	const router: RouterInstance<RegisteredRouteContracts> = {
		push: (destination) => getClient().instance.push(destination),
		replace: (destination) => getClient().instance.replace(destination),
		navigate: (destination) => getClient().instance.navigate(destination),
		navigateUrl: (url, options) => getClient().instance.navigateUrl(url, options),
		reset: (destination) => getClient().instance.reset(destination),
		back: (options) => getClient().instance.back(options),
		dismiss: () => getClient().instance.dismiss(),
		refresh: () => getClient().instance.refresh(),
		retry: () => getClient().instance.retry(),
		clearFailure: () => client?.instance.clearFailure(),
		href: (destination) => getClient().instance.href(destination),
		resolveUrl: (url) => getClient().instance.resolveUrl(url),
		validateDestination: (value, options) =>
			getClient().instance.validateDestination(value, options),
		getSnapshot: () => getClient().instance.getSnapshot(),
		subscribe: (listener) => getClient().instance.subscribe(listener),
		forStack: (stack) => getClient().instance.forStack(stack),
		addRoutes: (catalog, options) => getClient().instance.addRoutes(catalog, options),
		dispose: () => {
			client?.instance.dispose()
		},
	}
	bindRouterFacade(router, () => getClient().instance)
	const configure = (next: RouterConfiguration<RouteManifest, string>): void => {
		if (!isSealedRouteCatalog(next.catalog)) {
			throw new TypeError('Configure the default client with an original route catalog')
		}
		if (client && configuration) {
			const previousStacks = configuration.stacks ?? []
			const nextStacks = next.stacks ?? []
			if (
				configuration.base !== next.base ||
				JSON.stringify(configuration.allowedSchemes ?? []) !==
					JSON.stringify(next.allowedSchemes ?? []) ||
				JSON.stringify(configuration.allowedOrigins ?? []) !==
					JSON.stringify(next.allowedOrigins ?? []) ||
				previousStacks.length !== nextStacks.length ||
				previousStacks.some((stack, index) => stack !== nextStacks[index]) ||
				configuration.createCancellationController !== next.createCancellationController ||
				configuration.onSubscriberError !== next.onSubscriberError
			) {
				throw new Error('Router host settings changed; reload the client to apply them')
			}
		}
		const previous = configuration
		configuration = {
			...next,
			allowedSchemes: next.allowedSchemes ? [...next.allowedSchemes] : undefined,
			allowedOrigins: next.allowedOrigins ? [...next.allowedOrigins] : undefined,
			catalog: snapshotRouteCatalog(next.catalog),
			stacks: next.stacks ? [...next.stacks] : undefined,
			transitions: defineTransitions(next.transitions ?? {}),
		}
		try {
			if (client) {
				replaceRouterBaseCatalog(client.instance, configuration.catalog)
				replaceRouterTransitions(client.instance, configuration.transitions ?? {})
			}
		} catch (error) {
			configuration = previous
			throw error
		}
		configured.set(true)
	}
	return {
		router,
		configured,
		getClient,
		configure,
		hasStack: (stack: string) =>
			stack === 'root' || configuration?.stacks?.includes(stack) === true,
		stackNames: () => ['root', ...(configuration?.stacks ?? [])],
	}
}
