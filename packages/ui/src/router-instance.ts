import {
	admitNavigationBlockers,
	connectNavigationBlockers,
	hasNavigationBlockers,
} from './navigation-blocker'

import {
	createValidatedDestination,
	resolveValidatedDestination,
	validatedDestinationHref,
} from './validated-destination'

import { hasRouteContract, isSealedRouteCatalog } from './route-contract-scope'
import { routeRenderContent } from './route-render-content'
import {
	createRoutePreparation,
	createRoutePreparationBatch,
	preparedRedirectStack,
} from './routing-core'

import { createRouteRegistry, snapshotRouteCatalog } from './route-registry'
import { defineTransitions } from './route-transitions'
import type {
	ContractsOf,
	ContractRouteManifest,
	KnownRouteCatalog,
	NavigationDestination,
	NavigationResult,
	NavigationFailure,
	RouterNavigationState,
	RouteResolution,
	PreparedRouteMatch,
	RouteDestinationInput,
	RouteManifest,
	RoutePreparationOptions,
	RouterMatch,
	RouteTransitionResult,
	RouterHost,
	RouterHostResult,
	RouterHostCommand,
	RouterHostPreparation,
	RouterInstance,
	RouterNavigator,
	RouterOptions,
	RouterState,
	TransitionRegistry,
	TransitionNames,
	BuiltinRouteTransitionName,
	RouteTransitionName,
} from './props'

type Action = RouterHostCommand['action']
type Cancelled = Extract<RouterHostResult, { status: 'cancelled' }>
type Scope<Contracts, Stacks extends string, Transitions extends string> = {
	disposed: boolean
	dispose(): void
	preparation: ReturnType<typeof createRoutePreparation>
	lastFailure?: {
		input: unknown
		state: Extract<RouterNavigationState, { status: 'failed' }>
		hostCommit: RouterHost['commit']
	}
	navigator: RouterNavigator<Contracts, Stacks, Transitions>
	runHost(action: Action, commit: RouterHost['commit']): Promise<NavigationResult<Contracts>>
	replacePreparation(): void
}

const idleNavigation = Object.freeze({ status: 'idle' } as const)
function isNavigationFailure(result: {
	status: NavigationResult['status']
}): result is NavigationFailure {
	return (
		result.status === 'failed' ||
		result.status === 'not-found' ||
		result.status === 'forbidden' ||
		result.status === 'invalid-input' ||
		result.status === 'blocked' ||
		result.status === 'unsupported'
	)
}

function snapshotDestination(destination: RouteDestinationInput): RouteDestinationInput {
	return Object.freeze({
		...destination,
		...(destination.params ? { params: Object.freeze({ ...destination.params }) } : {}),
		...(destination.search
			? {
					search: Object.freeze(
						Object.fromEntries(
							Object.entries(destination.search).map(([key, value]) => [
								key,
								Array.isArray(value) ? Object.freeze([...value]) : value,
							]),
						),
					),
				}
			: {}),
	})
}

const defaultFacades = new WeakSet<object>()

/** @internal Ambient contracts belong to the configured default client only. */
export function isDefaultRouter(instance: object): boolean {
	return defaultFacades.has(instance)
}

const bindings = new WeakMap<object, (flow: string) => unknown>()
const ownedHosts = new WeakSet<RouterHost>()
const routerHosts = new WeakMap<object, RouterHost>()

/** @internal Rendering attachment must use the instance's navigation host. */
export function routerUsesHost(instance: object, host: RouterHost): boolean {
	return routerHosts.get(instance) === host
}

const hostNavigations = new WeakMap<
	object,
	(flow: string, commit: RouterHost['commit'], action: 'back' | 'forward') => Promise<void>
>()

/** @internal OS/browser traversal uses the same cancellation, context and
 * feedback machinery as an application navigation, without nesting commits. */
export function runRouterHostNavigation(
	instance: object,
	flow: string,
	commit: RouterHost['commit'],
	action: 'back' | 'forward' = 'back',
): Promise<void> {
	const run = hostNavigations.get(instance)
	if (!run) {
		throw new Error('Router instance is not owned by this runtime')
	}
	return run(flow, commit, action)
}

const catalogViews = new WeakMap<
	object,
	{
		read(): RouteManifest
		replaceBase(catalog: RouteManifest): void
		replaceTransitions(transitions: TransitionRegistry): void
		match(route: PreparedRouteMatch): unknown
	}
>()

/** @internal Hot-reload definitions without changing instance or hook identity. */
export function replaceRouterTransitions(instance: object, transitions: TransitionRegistry): void {
	const view = catalogViews.get(instance)
	if (!view) {
		throw new Error('Router instance is not owned by this runtime')
	}
	view.replaceTransitions(transitions)
}

/** Internal catalog reads for renderer hosts. Never expose mutable
 * application/request state through a public catalog API. */
export function readRouterCatalog(instance: object): RouteManifest {
	const read = catalogViews.get(instance)
	if (!read) {
		throw new Error('Router instance is not owned by this runtime')
	}
	return read.read()
}

/** Internal renderer projection: owner entries retain their prepared value;
 * runtime contributions must never masquerade as a declared DTO. */
export function readRouterMatch<Contracts>(
	instance: object,
	route: PreparedRouteMatch,
): RouterMatch<Contracts> {
	const view = catalogViews.get(instance)
	if (!view) {
		throw new Error('Router instance is not owned by this runtime')
	}
	return view.match(route) as RouterMatch<Contracts>
}

/** Internal default-client/HMR replacement, separate from public plugin IDs. */
export function replaceRouterBaseCatalog(instance: object, catalog: RouteManifest): void {
	const view = catalogViews.get(instance)
	if (!view) {
		throw new Error('Router instance is not owned by this runtime')
	}
	view.replaceBase(catalog)
}

/** Internal lazy facade identity. Hosts attach the facade so hook/provider
 * identity stays stable while bound operations use the owned instance. */
export function bindRouterFacade(facade: object, instance: () => RouterInstance<any>): void {
	if (bindings.has(facade)) {
		throw new Error('Router facade is already bound')
	}
	defaultFacades.add(facade)
	bindings.set(facade, (flow) => bindRouterFlow(instance(), flow))
	hostNavigations.set(facade, (flow, commit, action) =>
		runRouterHostNavigation(instance(), flow, commit, action),
	)
	catalogViews.set(facade, {
		read: () => readRouterCatalog(instance()),
		replaceBase: (catalog) => replaceRouterBaseCatalog(instance(), catalog),
		replaceTransitions: (transitions) => replaceRouterTransitions(instance(), transitions),
		match: (route) => readRouterMatch(instance(), route),
	})
}

/** Bind an existing instance to an adapter-owned rendering flow. This is
 * renderer integration plumbing; application code uses useRouter/forStack. */
export function bindRouterFlow<
	Contracts,
	Stacks extends string,
	Transitions extends string = RouteTransitionName,
>(
	instance: RouterInstance<Contracts, Stacks, Transitions>,
	flow: string,
): RouterNavigator<Contracts, Stacks, Transitions> {
	const bind = bindings.get(instance)
	if (!bind) {
		throw new Error('Router instance is not owned by this runtime')
	}
	return bind(flow) as RouterNavigator<Contracts, Stacks, Transitions>
}

/** Construct independent client navigation state around an explicit platform
 * host. Definitions may be shared; attempts, subscriptions and cleanup are local.
 * @example
 * import { createRouter } from '@octane-xplat/ui/routing/core'
 * const router = createRouter({ catalog, host, context: () => ({ account }) })
 * await router.push({ to: '/settings' })
 * router.dispose()
 */
export function createRouter<
	const Catalog extends ContractRouteManifest,
	const Stack extends string = never,
	const Effects extends TransitionRegistry = {},
>(
	configuration: RouterOptions<Catalog, Stack, Effects> & KnownRouteCatalog<NoInfer<Catalog>>,
): RouterInstance<
	ContractsOf<Catalog>,
	'root' | Stack,
	BuiltinRouteTransitionName | TransitionNames<Effects>
> {
	if (ownedHosts.has(configuration.host)) {
		throw new Error('A router host can belong to only one instance')
	}
	ownedHosts.add(configuration.host)
	try {
		const instance = constructRouter<Catalog, Stack, Effects>(configuration)
		routerHosts.set(instance, configuration.host)
		return instance
	} catch (error) {
		ownedHosts.delete(configuration.host)
		throw error
	}
}

function constructRouter<
	const Catalog extends ContractRouteManifest,
	const Stack extends string,
	const Effects extends TransitionRegistry,
>(
	configuration: RouterOptions<Catalog, Stack, Effects> & KnownRouteCatalog<NoInfer<Catalog>>,
): RouterInstance<
	ContractsOf<Catalog>,
	'root' | Stack,
	BuiltinRouteTransitionName | TransitionNames<Effects>
> {
	if (!isSealedRouteCatalog(configuration.catalog)) {
		throw new TypeError(
			'Router instances require an original catalog from defineRoutes, defineRuntimeRoutes or generated startup',
		)
	}
	if ('behaviors' in configuration) {
		throw new TypeError('Client behavior belongs in route definitions, not router options')
	}
	const destinationOwner = {}
	const options: RoutePreparationOptions & {
		host: RouterHost
		onSubscriberError?(error: unknown): void
	} = {
		...configuration,
		destinationOwner,
		allowedSchemes: configuration.allowedSchemes ? [...configuration.allowedSchemes] : undefined,
		allowedOrigins: configuration.allowedOrigins ? [...configuration.allowedOrigins] : undefined,
		stacks: configuration.stacks ? [...configuration.stacks] : undefined,
		catalog: snapshotRouteCatalog(configuration.catalog),
	}
	const matches = new WeakMap<object, RouterMatch<ContractsOf<Catalog>>>()
	const declaredPaths = new Set(
		options.catalog.routes.filter(hasRouteContract).map((route) => '/' + route.segments.join('/')),
	)
	const project = (route: PreparedRouteMatch | null): RouterMatch<ContractsOf<Catalog>> | null => {
		if (!route) {
			return null
		}
		let match = matches.get(route)
		if (!match) {
			match = {
				...route,
				contract: declaredPaths.has(route.to) ? 'declared' : 'runtime',
			} as RouterMatch<ContractsOf<Catalog>>

			matches.set(route, match)
			// Rendering providers may already carry the public projection. Keep
			// its identity stable so retained-entry operations can check ownership.
			matches.set(match, match)
		}
		return match
	}
	let transitions: TransitionRegistry = defineTransitions(configuration.transitions ?? {})
	type Contracts = ContractsOf<Catalog>
	type Stacks = 'root' | Stack
	type Transitions = BuiltinRouteTransitionName | TransitionNames<Effects>
	type Result = NavigationResult<Contracts>
	const claimedOrder = new Map<string, number>()
	const scopes = new Map<string, Scope<Contracts, Stacks, Transitions>>()
	const listeners = new Set<() => void>()
	const snapshots = new Map<string, RouterState<Contracts>>()
	type Attempt = {
		order: number
		flow: string
		claims: Set<string>
		destination: RouteDestinationInput | null
		action: Action
		navigation: Extract<RouterNavigationState, { status: 'pending' }>
		cancel(reason: Cancelled['reason']): void
		cancelForOwner(): void
	}
	const pending = new Map<string, Attempt>()
	const active = new Set<Attempt>()
	let disposed = false
	let registryChanging = false
	let nextAttempt = 0
	const keyFor = (flow: string) => (options.host.history === 'linear' ? 'history' : flow)
	const notify = () => {
		snapshots.clear()
		// Observers may unsubscribe or subscribe again during notification.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const listener of [...listeners]) {
			try {
				listener()
			} catch (error) {
				try {
					if (options.onSubscriberError) {
						options.onSubscriberError(error)
					} else {
						console.warn('[octane-xplat] Router subscriber threw')
					}
				} catch {
					/* observers cannot undo a host commit */
				}
			}
		}
	}
	const unsubscribe = options.host.subscribe((change) => {
		if (change?.external || change?.ownerDisposed || change?.flowDisposed) {
			for (const [flow, scope] of scopes) {
				if (!change.flow || keyFor(flow) === keyFor(change.flow)) {
					scope.lastFailure = undefined
				}
			}
		}
		if (change?.flowDisposed && change.flow) {
			const scope = scopes.get(change.flow)
			scope?.dispose()
			scopes.delete(change.flow)
			snapshots.delete(change.flow)
			if (options.host.history === 'independent') {
				claimedOrder.delete(change.flow)
			}
		}
		if (change?.ownerDisposed || change?.flowDisposed) {
			for (const attempt of active) {
				if (!change.flow || attempt.flow === change.flow) {
					attempt.cancelForOwner()
				}
			}
		} else if (change?.external) {
			for (const attempt of active) {
				if (!change.flow || attempt.claims.has(keyFor(change.flow))) {
					attempt.cancel('aborted')
				}
			}
		}
		notify()
	})
	const registry = createRouteRegistry(options.catalog, (catalog) => {
		registryChanging = true
		try {
			// Cancellation callbacks may remove attempts from this set.
			// oxlint-disable-next-line unicorn/no-useless-spread
			for (const attempt of [...active]) {
				attempt.cancel('registry-changed')
			}

			options.catalog = catalog
			for (const scope of scopes.values()) {
				scope.replacePreparation()
			}
		} finally {
			registryChanging = false
		}
		notify()
	})
	const scopeFor = (flow: string): Scope<Contracts, Stacks, Transitions> => {
		if (disposed) {
			throw new Error('Router instance is disposed')
		}
		const found = scopes.get(flow)
		if (found) {
			return found
		}
		const makePreparation = () =>
			createRoutePreparation({
				...options,
				history: 'independent',
				transitionNames: ['default', 'none', 'fade', ...Object.keys(transitions)],
			})
		let preparation = makePreparation()
		let disconnectBlockers = () => {}
		const scope = {
			disposed: options.host.getSnapshot(flow).disposed ?? false,
			preparation,
			dispose() {
				scope.disposed = true
				disconnectBlockers()
				scope.lastFailure = undefined
				preparation.dispose()
			},
			replacePreparation() {
				preparation.dispose('registry-changed')
				preparation = makePreparation()
				scope.preparation = preparation
			},
		} as Scope<Contracts, Stacks, Transitions>
		const ended: RouterState<Contracts> = {
			route: null,
			navigation: idleNavigation,
			canGoBack: false,
			modal: false,
		}
		const snapshot = (): RouterState<Contracts> => {
			if (disposed || scope.disposed) {
				return ended
			}
			const previous = snapshots.get(flow)
			if (previous) {
				return previous
			}
			const host = disposed
				? { route: null, canGoBack: false, modal: false }
				: options.host.getSnapshot(flow)
			const attempt = pending.get(keyFor(flow))
			if (host.disposed) {
				return ended
			}
			const state = {
				canGoBack: host.canGoBack,
				modal: host.modal,
				route: project(host.route),
				navigation:
					attempt?.flow === flow
						? attempt.navigation
						: (scope.lastFailure?.state ?? idleNavigation),
			}
			snapshots.set(flow, state)
			return state
		}
		const stackForFlow = () =>
			options.host.getSnapshot(flow).route?.stack ??
			(options.stacks?.includes(flow) ? flow : 'root')
		const run = async (
			action: Action,
			input?: unknown,
			hostCommit = options.host.commit,
		): Promise<Result> => {
			if (disposed || scope.disposed) {
				return { status: 'cancelled', reason: 'disposed' }
			}
			if (registryChanging) {
				return { status: 'cancelled', reason: 'registry-changed' }
			}
			let preflight: NavigationFailure | undefined
			let resolved: RouteResolution | undefined
			try {
				input = resolveValidatedDestination(input, destinationOwner)
				if (
					input !== null &&
					typeof input === 'object' &&
					!Array.isArray(input) &&
					(input as RouteDestinationInput).stack === undefined
				) {
					input = { ...input, stack: stackForFlow() }
				}

				resolved =
					input === undefined
						? undefined
						: typeof input === 'string'
							? preparation.resolveUrl(input)
							: preparation.resolveDestination(input)
			} catch (error) {
				preflight = { status: 'invalid-input', path: 'destination', error }
			}
			if (action === 'reset' && !options.host.canReset) {
				preflight = { status: 'unsupported', operation: 'reset' }
			}
			const key = keyFor(flow)
			pending.get(key)?.cancel('superseded')
			let cancelled: Cancelled | undefined
			let committing = false
			let refused = false
			let preparing = false
			let preparingStack = resolved?.status === 'matched' ? resolved.destination.stack : 'root'
			let redirected = false
			// Preserve the synchronous context snapshot when no confirmation holds the
			// attempt. A held attempt snapshots context after the user's approval.
			let batch =
				action !== 'refresh' && hasNavigationBlockers(scope.navigator)
					? undefined
					: createRoutePreparationBatch(preparation)
			const preparationBatch = () => (batch ??= createRoutePreparationBatch(preparation))
			const preparedValues = new WeakSet<object>()
			let cancel!: (result: Cancelled) => void
			const cancellation = new Promise<Cancelled>((resolve) => {
				cancel = resolve
			})
			const destination =
				resolved?.status === 'matched' ? snapshotDestination(resolved.destination) : null
			const navigation = Object.freeze({ status: 'pending' as const, action, destination })
			const attempt = {
				order: ++nextAttempt,
				flow,
				action,
				claims: new Set([key]),
				destination,
				navigation,
				cancelForOwner(): void {
					if (!committing) {
						attempt.cancel('aborted')
					}
				},
				cancel(reason: Cancelled['reason']) {
					if (cancelled || (committing && reason === 'superseded')) {
						return
					}
					cancelled = { status: 'cancelled', reason }
					if (preparing) {
						preparation.cancel(preparingStack)
					}
					cancel(cancelled)
				},
			}
			claimedOrder.set(key, attempt.order)
			const claims = attempt.claims
			active.add(attempt)
			pending.set(key, attempt)
			notify()
			const isCurrent = () =>
				!disposed && !cancelled && !refused && (committing || pending.get(key) === attempt)
			let finishBlockers!: () => void
			const blockerFinished = new Promise<void>((resolve) => {
				finishBlockers = resolve
			})
			let admission: Promise<boolean> | undefined
			let admitted = false
			const admit = (): true | Promise<boolean> => {
				if (admitted || action === 'refresh') {
					return true
				}
				if (admission) {
					return admission
				}
				if (!hasNavigationBlockers(scope.navigator)) {
					admitted = true
					return true
				}
				admission = admitNavigationBlockers(scope.navigator, {
					action,
					destination,
					cancellation,
					finished: blockerFinished,
					isCurrent,
					// A refusal lets the host finish browser history correction before
					// settlement. Supersession/disposal still use ordinary cancellation.
					cancel: () => {
						refused = true
					},
				}).then((allowed) => {
					admitted = allowed
					return allowed
				})
				return admission
			}
			const beginCommit = () => {
				if (!isCurrent()) {
					return false
				}
				committing = true
				return true
			}
			const prepareRetained: NonNullable<RouterHostCommand['prepare']> = async (
				value,
				requestedFlow = flow,
			): Promise<RouterHostPreparation> => {
				if (!isCurrent()) {
					return cancelled ?? { status: 'cancelled', reason: 'superseded' }
				}
				if (committing || preparing) {
					return {
						status: 'unsupported',
						operation: committing ? 'prepare-after-commit' : 'concurrent-host-preparation',
					}
				}
				const allowed = admit()
				if (allowed !== true && !(await allowed)) {
					return cancelled ?? { status: 'cancelled', reason: 'aborted' }
				}
				if (!isCurrent()) {
					return cancelled ?? { status: 'cancelled', reason: 'superseded' }
				}
				const expectedStack =
					options.host.getSnapshot(requestedFlow).route?.stack ??
					(options.stacks?.includes(requestedFlow) ? requestedFlow : 'root')
				let candidate: RouteResolution
				try {
					const destination = resolveValidatedDestination(value, destinationOwner)
					if (typeof destination === 'string') {
						const url = preparation.resolveUrl(destination)
						if (url.status !== 'matched') {
							return url
						}

						candidate = preparation.resolveDestination({ ...url.destination, stack: expectedStack })
					} else {
						candidate = preparation.resolveDestination(
							destination !== null && typeof destination === 'object' && !Array.isArray(destination)
								? {
										...destination,
										stack: (destination as RouteDestinationInput).stack ?? expectedStack,
									}
								: destination,
						)
					}
				} catch (error) {
					return { status: 'invalid-input', path: 'destination', error }
				}
				if (candidate.status !== 'matched') {
					return candidate
				}
				preparingStack = candidate.destination.stack
				preparing = true
				try {
					const result = await preparationBatch().prepare(candidate.destination)
					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					if (result.status !== 'ready') {
						return result
					}

					redirected ||= result.redirected
					const route = result.match
					const targetFlow =
						preparedRedirectStack(route) ??
						(route.stack !== expectedStack ? route.stack : requestedFlow)

					const content = routeRenderContent(options.catalog, route)
					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					const ready = {
						status: 'ready' as const,
						flow: targetFlow,
						route,
						content,
						transition: route.transition ? transitions[route.transition] : undefined,
						redirected: result.redirected,
					}

					preparedValues.add(ready)
					return ready
				} catch (error) {
					return { status: 'failed', phase: 'commit', error }
				} finally {
					preparing = false
				}
			}
			const work = async (): Promise<Result> => {
				try {
					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					if (preflight) {
						return preflight
					}

					if (resolved && resolved.status !== 'matched') {
						return resolved
					}

					const allowed = admit()
					if (allowed !== true && !(await allowed)) {
						if (action === 'back' || action === 'forward') {
							// An external browser traversal already moved its URL. The host
							// receives a non-current command solely to correct that position.
							await hostCommit.call(options.host, {
								action,
								flow,
								isCurrent,
								beginCommit,
								cancellation,
								prepare: prepareRetained,
							})
						}

						return cancelled ?? { status: 'cancelled', reason: 'aborted' }
					}

					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					let route: PreparedRouteMatch | undefined
					let redirectFlow: string | undefined
					const refreshing = action === 'refresh' ? snapshot().route : null
					if (input !== undefined) {
						preparing = true
						const result = await preparationBatch().prepare(input)
						preparing = false
						if (!isCurrent()) {
							return cancelled ?? { status: 'cancelled', reason: 'superseded' }
						}

						if (result.status !== 'ready') {
							return result
						}

						route = result.match
						redirectFlow = preparedRedirectStack(route)
						redirected ||= result.redirected
						if (refreshing && refreshing.to === route.to) {
							route = {
								...route,
								presentation: refreshing.presentation,
								transition: refreshing.transition,
							}
						}
					}

					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					const targetFlow = route
						? (redirectFlow ?? (route.stack !== stackForFlow() ? route.stack : flow))
						: flow

					const targetKey = keyFor(targetFlow)
					if (targetKey !== key) {
						const previous = pending.get(targetKey)
						if ((claimedOrder.get(targetKey) ?? 0) > attempt.order) {
							attempt.cancel('superseded')
							return cancelled!
						}

						previous?.cancel('superseded')
						claimedOrder.set(targetKey, attempt.order)
						claims.add(targetKey)
						pending.set(targetKey, attempt)
					}

					let committed = await hostCommit.call(options.host, {
						action,
						route,
						content: route ? routeRenderContent(options.catalog, route) : undefined,
						transition: route?.transition ? transitions[route.transition] : undefined,
						flow: targetFlow,
						isCurrent,
						beginCommit,
						cancellation,
						prepare: prepareRetained,
					})

					const handed = new WeakSet<object>()
					let handoffs = 0
					while (committed.status === 'handoff') {
						const handoff = committed
						const ready = handoff.prepared
						if (!isCurrent()) {
							return cancelled ?? { status: 'cancelled', reason: 'superseded' }
						}

						if (
							committing ||
							!preparedValues.has(ready) ||
							handed.has(ready) ||
							!['push', 'replace', 'refresh'].includes(handoff.action)
						) {
							return { status: 'unsupported', operation: 'invalid-host-handoff' }
						}

						if (++handoffs > 16) {
							return {
								status: 'failed',
								phase: 'commit',
								error: new Error('Host handoff limit exceeded'),
							}
						}

						handed.add(ready)
						const targetKey = keyFor(ready.flow)
						if ((claimedOrder.get(targetKey) ?? 0) > attempt.order) {
							attempt.cancel('superseded')
							return cancelled!
						}

						const previous = pending.get(targetKey)
						if (previous !== attempt) {
							previous?.cancel('superseded')
						}

						claimedOrder.set(targetKey, attempt.order)
						claims.add(targetKey)
						pending.set(targetKey, attempt)
						committed = await options.host.commit({
							action: handoff.action,
							flow: ready.flow,
							route: ready.route,
							content: ready.content,
							transition: ready.transition,
							isCurrent,
							beginCommit,
							cancellation,
							prepare: prepareRetained,
							beforeMutation: handoff.beforeMutation,
							restore: handoff.action !== 'push',
						})
					}

					if (!isCurrent()) {
						return cancelled ?? { status: 'cancelled', reason: 'superseded' }
					}

					if (committed.status !== 'committed') {
						return committed
					}

					const finished = committed.finished
						? Promise.resolve(committed.finished).catch((error): RouteTransitionResult => ({
								status: 'failed',
								error,
							}))
						: Promise.resolve<RouteTransitionResult>({
								status: 'skipped',
								reason: 'disabled',
							})

					return {
						...committed,
						route: project(committed.route),
						redirected,
						finished,
					}
				} catch (error) {
					return { status: 'failed', phase: 'commit', error }
				}
			}
			try {
				const result = await Promise.race([work(), cancellation])
				if (claimedOrder.get(key) === attempt.order) {
					if (isNavigationFailure(result)) {
						scope.lastFailure = {
							hostCommit,
							input: attempt.destination ?? input,
							state: Object.freeze({
								status: 'failed',
								action,
								destination: attempt.destination,
								result: Object.freeze({ ...result }),
							}),
						}
					} else if (result.status === 'committed') {
						scope.lastFailure = undefined
					}
				}

				return result
			} finally {
				finishBlockers()
				active.delete(attempt)
				for (const claim of claims) {
					if (pending.get(claim) === attempt) {
						pending.delete(claim)
					}
				}

				notify()
			}
		}
		scope.runHost = (action, commit) => run(action, undefined, commit)
		const scopedDestination = (value: unknown): unknown => {
			const input = resolveValidatedDestination(value, destinationOwner)
			return input !== null && typeof input === 'object' && !Array.isArray(input)
				? { ...input, stack: (input as RouteDestinationInput).stack ?? stackForFlow() }
				: input
		}
		const request = (
			action: 'push' | 'replace' | 'reset',
			destination: NavigationDestination<Contracts, Stacks, Transitions>,
		): Promise<Result> => {
			if (disposed || scope.disposed) {
				return Promise.resolve({ status: 'cancelled', reason: 'disposed' })
			}
			try {
				const input = resolveValidatedDestination(
					destination,
					destinationOwner,
				) as RouteDestinationInput

				const resolved = preparation.resolveDestination(scopedDestination(destination))
				if (resolved.status !== 'matched') {
					return run(action, destination)
				}

				if (input.stack && input.stack !== flow) {
					return scopeFor(input.stack).navigator[action](destination)
				}

				return run(action, resolved.destination)
			} catch {
				return run(action, destination)
			}
		}
		scope.navigator = {
			push: (destination) => request('push', destination),
			replace: (destination) => request('replace', destination),
			navigate: (destination) => {
				try {
					const input = resolveValidatedDestination(
						destination,
						destinationOwner,
					) as RouteDestinationInput

					return request(input.replace ? 'replace' : 'push', destination)
				} catch {
					return run('push', destination)
				}
			},
			navigateUrl: (url, settings) => {
				if (disposed || scope.disposed) {
					return Promise.resolve({ status: 'cancelled', reason: 'disposed' })
				}
				if (!disposed) {
					const resolved = preparation.resolveUrl(url)
					if (
						resolved.status === 'matched' &&
						resolved.destination.stack &&
						resolved.destination.stack !== stackForFlow()
					) {
						return scopeFor(resolved.destination.stack).navigator.navigateUrl(url, settings)
					}
				}
				return run(settings?.replace ? 'replace' : 'push', url)
			},
			reset: (destination) => request('reset', destination),
			back: (settings) => {
				if (disposed || scope.disposed) {
					return Promise.resolve({ status: 'cancelled', reason: 'disposed' })
				}
				if (snapshot().canGoBack) {
					return run('back')
				}
				pending.get(keyFor(flow))?.cancel('aborted')
				return settings?.fallback
					? request('replace', settings.fallback)
					: Promise.resolve({ status: 'at-base' })
			},
			dismiss: () =>
				disposed || scope.disposed
					? Promise.resolve({ status: 'cancelled', reason: 'disposed' })
					: snapshot().modal
						? run('dismiss')
						: Promise.resolve({ status: 'not-modal' }),
			refresh: () => {
				if (disposed || scope.disposed) {
					return Promise.resolve({ status: 'cancelled', reason: 'disposed' })
				}
				const current = snapshot().route
				return current ? run('refresh', current.href) : Promise.resolve({ status: 'unmatched' })
			},
			retry: () =>
				scope.lastFailure
					? run(
							scope.lastFailure.state.action,
							scope.lastFailure.input,
							scope.lastFailure.hostCommit,
						)
					: scope.navigator.refresh(),
			clearFailure: () => {
				if (scope.lastFailure) {
					scope.lastFailure = undefined
					notify()
				}
			},
			href: (destination) => {
				const checked = validatedDestinationHref(destination, destinationOwner, {
					stack: stackForFlow(),
					base: options.base,
				})
				if (checked !== undefined) {
					return checked
				}
				const input = resolveValidatedDestination(
					destination,
					destinationOwner,
				) as RouteDestinationInput
				const resolved = preparation.resolveDestination({
					...input,
					stack: input.stack ?? stackForFlow(),
				})
				if (resolved.status !== 'matched') {
					throw new TypeError('Invalid route destination')
				}
				return resolved.href
			},
			resolveUrl: (url) => preparation.resolveUrl(url),
			preload: async (value, settings) => {
				if (disposed || scope.disposed) {
					return { status: 'cancelled', reason: 'disposed' }
				}
				if (registryChanging) {
					return { status: 'cancelled', reason: 'registry-changed' }
				}
				let input: unknown
				try {
					input = scopedDestination(value)
				} catch (error) {
					return { status: 'invalid-input', path: 'destination', error }
				}
				const source = preparation
				const result = await source.preload(input, settings)
				if (disposed || scope.disposed) {
					return { status: 'cancelled', reason: 'disposed' }
				}
				if (source !== preparation) {
					return { status: 'cancelled', reason: 'registry-changed' }
				}
				if (settings?.signal?.aborted) {
					return { status: 'cancelled', reason: 'aborted' }
				}
				return result
			},
			validateDestination: async (value, settings) => {
				if (disposed || scope.disposed) {
					return { status: 'cancelled', reason: 'disposed' }
				}
				if (registryChanging) {
					return { status: 'cancelled', reason: 'registry-changed' }
				}
				let input: unknown
				let implicitStack: boolean
				try {
					const raw = resolveValidatedDestination(value, destinationOwner)
					implicitStack =
						raw !== null &&
						typeof raw === 'object' &&
						!Array.isArray(raw) &&
						(raw as RouteDestinationInput).stack === undefined

					input = scopedDestination(value)
				} catch (error) {
					return { status: 'invalid-input', path: 'destination', error }
				}

				const source = preparation
				const result = await source.validateDestination(input, settings)
				if (disposed || scope.disposed) {
					return { status: 'cancelled', reason: 'disposed' }
				}
				if (source !== preparation) {
					return { status: 'cancelled', reason: 'registry-changed' }
				}
				if (settings?.signal?.aborted) {
					return { status: 'cancelled', reason: 'aborted' }
				}
				if (result.status !== 'valid') {
					return result
				}
				return {
					...result,
					destination: createValidatedDestination(
						{ ...result.destination, stack: implicitStack ? undefined : result.destination.stack },
						destinationOwner,
					),
				}
			},
			getSnapshot: snapshot,
			subscribe: (listener) => {
				if (disposed || scope.disposed) {
					return () => {}
				}
				listeners.add(listener)
				return () => {
					listeners.delete(listener)
				}
			},
		}
		if (!scope.disposed) {
			disconnectBlockers = connectNavigationBlockers(scope.navigator)
		}
		if (scope.disposed) {
			preparation.dispose()
		} else {
			scopes.set(flow, scope)
		}
		return scope
	}
	const instance: RouterInstance<Contracts, Stacks, Transitions> = {
		...scopeFor('root').navigator,
		addRoutes: (catalog, settings) => {
			if (!isSealedRouteCatalog(catalog)) {
				throw new TypeError(
					'Register original route catalogs; author changes through route builders',
				)
			}
			if (registryChanging) {
				throw new Error('Route registry is updating')
			}
			return registry.add(catalog, settings)
		},
		forStack: (stack) => {
			if (stack !== 'root' && !options.stacks?.includes(stack)) {
				throw new TypeError('Unknown route stack')
			}
			return scopeFor(stack).navigator
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			registry.dispose()
			for (const attempt of active) {
				attempt.cancel('disposed')
			}
			for (const scope of scopes.values()) {
				scope.dispose()
			}
			pending.clear()
			active.clear()
			claimedOrder.clear()
			const errors: unknown[] = []
			try {
				unsubscribe()
			} catch (error) {
				errors.push(error)
			}
			try {
				options.host.dispose?.()
			} catch (error) {
				errors.push(error)
			}
			notify()
			listeners.clear()
			scopes.clear()
			bindings.delete(instance)
			hostNavigations.delete(instance)
			if (errors.length) {
				throw errors[0]
			}
		},
	}
	bindings.set(instance, (flow) => scopeFor(flow).navigator)
	hostNavigations.set(instance, async (flow, commit, action) => {
		await scopeFor(flow).runHost(action, commit)
	})
	catalogViews.set(instance, {
		match: (route) => project(route)!,
		read: () => options.catalog,
		replaceTransitions: (next) => {
			transitions = defineTransitions(next)
			for (const scope of scopes.values()) {
				scope.replacePreparation()
			}
		},
		replaceBase(catalog) {
			if (registryChanging) {
				throw new Error('Route registry is updating')
			}
			registry.replaceBase(catalog)
		},
	})
	return instance
}
