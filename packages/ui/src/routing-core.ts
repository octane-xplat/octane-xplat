import { resolveValidatedDestination } from './validated-destination'
import { createRouteUrlPolicy } from './route-url-policy'
import { routeStackBase } from './route-stack-url'
import {
	buildRouteLocation,
	matchRouteSegments,
	parseRouteLocation,
	routePatternPath,
} from '@octane-xplat/lib/route-pattern'

import type { RouteSearchInput } from '@octane-xplat/lib/route-pattern'
import type {
	Destination,
	DestinationValidationResult,
	ValidatedDestination,
	RouteDestinationInput,
	RouteMeta,
	RoutePreparationArgs,
	RoutePreparationOptions,
	RoutePreparationResult,
	RouteResolution,
	RouteCancellationSignal,
	PreparedRouteMatch,
} from './props'

/** Redirect carrier for the host-independent pipeline; adapters decide whether
 * to follow it internally or turn it into an HTTP Location response. */
export class DestinationRedirect extends Error {
	readonly destination: RouteDestinationInput | ValidatedDestination
	constructor(destination: RouteDestinationInput | ValidatedDestination) {
		super('route redirect')
		this.destination = destination
		this.name = 'DestinationRedirect'
	}
}

/** Stop the current guard or loader and prepare a typed destination instead. */
export function redirect(destination: Destination | ValidatedDestination): never {
	throw new DestinationRedirect(destination)
}

/** Explicit missing-resource outcome, distinct from an unmatched URL pattern. */
export class RouteResourceNotFound extends Error {
	constructor() {
		super('Route resource not found')
		this.name = 'RouteResourceNotFound'
	}
}

/** Explicit access-denied outcome; server and presentation adapters choose UI/status. */
export class RouteForbidden extends Error {
	constructor() {
		super('Route access forbidden')
		this.name = 'RouteForbidden'
	}
}

const record = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value)

const dependencyRecord = (value: unknown): value is Record<string, unknown> =>
	record(value) &&
	(Object.getPrototypeOf(value) === null ||
		Object.getPrototypeOf(value)?.constructor?.name === 'Object')

const pathOf = (meta: RouteMeta) => '/' + meta.segments.join('/')
const redirectStacks = new WeakMap<object, string>()

/** @internal Preserve explicit redirect scope separately from inherited logical
 * stacks, including a root escape from a root-owned modal. */
export function preparedRedirectStack(match: PreparedRouteMatch): string | undefined {
	return redirectStacks.get(match)
}

type PrepareSettings = { signal?: RouteCancellationSignal; redirects?: 'follow' | 'return' }
type PreparationBatch = {
	prepare(input: unknown, settings?: PrepareSettings): Promise<RoutePreparationResult>
}

const preparationBatches = new WeakMap<object, () => PreparationBatch>()

/** @internal Reuse compiled definitions while one host operation prepares
 * retained entries against a single root snapshot. */
export function createRoutePreparationBatch(engine: object): PreparationBatch {
	const create = preparationBatches.get(engine)
	if (!create) {
		throw new TypeError('Unknown route preparation engine')
	}
	return create()
}

function readContext(
	source: RoutePreparationOptions['context'],
): Record<string, unknown> | Promise<Record<string, unknown>> {
	const copy = (root: unknown) => {
		if (root === undefined) {
			return {}
		}
		if (!dependencyRecord(root)) {
			throw new TypeError('Route context must be a plain dependency object')
		}
		return { ...root }
	}
	const supplied = typeof source === 'function' ? source() : source
	return typeof source === 'function' && !dependencyRecord(supplied)
		? Promise.resolve(supplied).then(copy)
		: copy(supplied)
}

/** Create isolated matching and preparation state without importing a renderer,
 * browser history, native host, or HTTP implementation. Platform adapters provide
 * cancellation primitives; stale work is suppressed even when it ignores abort. */
export function createRoutePreparation(options: RoutePreparationOptions) {
	options = { ...options }
	const explicitStacks = new WeakMap<object, string>()
	const routeUrl = createRouteUrlPolicy(options)
	const routes = options.catalog.routes.map((route) => ({
		...route,
		segments: [...route.segments],
		preparation: route.preparation ? { ...route.preparation } : undefined,
	}))
	const screens = new Map(Object.entries(options.catalog.screens))
	const behaviors = new Map(
		Object.entries(options.behaviors ?? {}).map(([key, behavior]) => [key, { ...behavior }]),
	)
	const stacks = new Set(['root', ...(options.stacks ?? [])])
	const validations = new Set<{ cancel(reason: CancelReason): void }>()
	const pending = new Map<string, { cancel(reason: CancelReason): void }>()
	const claimedOrder = new Map<string, number>()
	let nextAttempt = 0
	let disposed = false
	type CancelReason = Extract<RoutePreparationResult, { status: 'cancelled' }>['reason']
	const invalid = (path: string, error: unknown): RouteResolution => ({
		status: 'invalid-input',
		path,
		error,
	})
	const keyFor = (stack: string) => (options.history === 'linear' ? 'history' : stack)
	const metaFor = (to: string) => routes.find((meta) => pathOf(meta) === to)
	const find = (segments: readonly string[]) => {
		for (const meta of routes) {
			const params = matchRouteSegments(meta.segments, segments)
			if (params) {
				return { meta, params: params as Record<string, string> }
			}
		}
		return undefined
	}
	const href = (destination: RouteDestinationInput): string => {
		const meta = metaFor(destination.to)
		if (!meta) {
			throw new TypeError('Unknown route pattern')
		}
		const stack = destination.stack ?? 'root'
		if (!stacks.has(stack)) {
			throw new TypeError('Unknown route stack')
		}
		return buildRouteLocation(
			meta.segments,
			destination.params,
			destination.search as RouteSearchInput,
			destination.hash,
			routeStackBase(options.base, stack),
		)
	}
	const resolveUrl = (url: string): RouteResolution => {
		try {
			const parsed = parseRouteLocation(routeUrl(url), options.base)
			let stack = 'root'
			let segments = parsed.segments
			if (segments[0]?.startsWith('@')) {
				stack = decodeURIComponent(segments[0].slice(1))
				if (stack === 'root' || !stacks.has(stack)) {
					return invalid('stack', new TypeError('Unknown named route stack'))
				}
				segments = segments.slice(1)
			}
			const found = find(segments)

			if (!found) {
				return { status: 'not-found', reason: 'pattern' }
			}

			if (typeof screens.get(found.meta.name) !== 'function') {
				return { status: 'not-found', reason: 'unavailable' }
			}

			const destination: RouteDestinationInput = {
				to: pathOf(found.meta),
				params: found.params,
				search: parsed.search,
				stack,
				hash: parsed.hash,
			}

			return { status: 'matched', destination, name: found.meta.name, href: href(destination) }
		} catch (error) {
			return invalid('url', error)
		}
	}
	const resolveDestination = (input: unknown, fallbackStack = 'root'): RouteResolution => {
		try {
			input = resolveValidatedDestination(input, options.destinationOwner)
			if (!record(input)) {
				return invalid('destination', new TypeError('Expected a destination object'))
			}

			const fields = { ...input }

			const allowed = [
				'to',
				'params',
				'search',
				'stack',
				'hash',
				'presentation',
				'transition',
				'replace',
			]

			const extra = Object.keys(fields).find((key) => !allowed.includes(key))
			if (extra) {
				return invalid(extra, new TypeError('Undeclared destination field'))
			}

			if (typeof fields.to !== 'string' || routePatternPath(fields.to) !== fields.to) {
				return invalid('to', new TypeError('Expected a canonical absolute route pattern'))
			}

			if (fields.params !== undefined && !record(fields.params)) {
				return invalid('params', new TypeError('Expected path params'))
			}

			if (fields.search !== undefined && !record(fields.search)) {
				return invalid('search', new TypeError('Expected search params'))
			}

			for (const key of ['stack', 'hash', 'transition']) {
				if (fields[key] !== undefined && typeof fields[key] !== 'string') {
					return invalid(key, new TypeError('Expected a string'))
				}
			}

			if (
				fields.presentation !== undefined &&
				fields.presentation !== 'push' &&
				fields.presentation !== 'modal'
			) {
				return invalid(
					'presentation',
					new TypeError('Expected push or modal; animation belongs in transition'),
				)
			}

			if (fields.replace !== undefined && typeof fields.replace !== 'boolean') {
				return invalid('replace', new TypeError('Expected a boolean'))
			}

			const destination = {
				...fields,
				stack: fields.stack ?? fallbackStack,
			} as unknown as RouteDestinationInput

			if (!metaFor(destination.to)) {
				return { status: 'not-found', reason: 'pattern' }
			}

			const resolved = resolveUrl(href(destination))
			if (resolved.status !== 'matched') {
				return resolved
			}

			if (resolved.destination.to !== destination.to) {
				return invalid(
					'params',
					new TypeError(
						`Path parameters for "${destination.to}" select the more specific route "${resolved.destination.to}"; navigate to that route directly or use different parameter values`,
					),
				)
			}

			const result = {
				...resolved,
				destination: {
					...resolved.destination,
					presentation: destination.presentation,
					transition: destination.transition,
					replace: destination.replace,
				},
			}

			if (typeof fields.stack === 'string') {
				explicitStacks.set(result, fields.stack)
			}

			return result
		} catch (error) {
			return invalid('destination', error)
		}
	}
	const transitionProblem = (
		destination: RouteDestinationInput,
	): Extract<RoutePreparationResult, { status: 'invalid-input' }> | undefined => {
		const transition = destination.transition ?? metaFor(destination.to)?.transition
		if (transition && options.transitionNames && !options.transitionNames.includes(transition)) {
			return {
				status: 'invalid-input',
				path: 'transition',
				error: new TypeError('Unknown route transition'),
			}
		}
	}
	const validateSearch = async (
		destination: RouteDestinationInput,
	): Promise<Record<string, unknown>> => {
		const meta = metaFor(destination.to)!
		const behavior = behaviors.get(meta.name) ?? behaviors.get(destination.to) ?? meta.preparation
		if (!behavior?.validateSearch && Object.keys(destination.search ?? {}).length) {
			throw new TypeError('This route declares no search parameters')
		}
		// Validators may transform their input. Never mutate the canonical raw
		// destination snapshot or its repeated-query arrays while doing so.
		const raw = Object.fromEntries(
			Object.entries(destination.search ?? {}).map(([key, value]) => [
				key,
				Array.isArray(value) ? [...value] : value,
			]),
		)
		const search = behavior?.validateSearch ? await behavior.validateSearch(raw) : raw
		if (!dependencyRecord(search)) {
			throw new TypeError('Search validation must return a plain object')
		}
		return search
	}
	const validateDestination = async (
		input: unknown,
		settings: { signal?: RouteCancellationSignal } = {},
	): Promise<DestinationValidationResult<RouteDestinationInput>> => {
		if (disposed) {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (settings.signal?.aborted) {
			return { status: 'cancelled', reason: 'aborted' }
		}
		const resolved = resolveDestination(input)
		if (resolved.status !== 'matched') {
			return resolved
		}
		const transition = transitionProblem(resolved.destination)
		if (transition) {
			return transition
		}
		let cancelled: CancelReason | undefined
		let finishCancellation!: (result: DestinationValidationResult<RouteDestinationInput>) => void
		const cancellation = new Promise<DestinationValidationResult<RouteDestinationInput>>(
			(resolve) => {
				finishCancellation = resolve
			},
		)
		const attempt = {
			cancel(reason: CancelReason) {
				if (cancelled) {
					return
				}
				cancelled = reason
				finishCancellation({ status: 'cancelled', reason })
			},
		}
		validations.add(attempt)
		const abort = () => attempt.cancel('aborted')
		settings.signal?.addEventListener('abort', abort, { once: true })
		if (settings.signal?.aborted) {
			abort()
		}
		const work = async (): Promise<DestinationValidationResult<RouteDestinationInput>> => {
			try {
				if (cancelled) {
					return { status: 'cancelled', reason: cancelled }
				}

				await validateSearch(resolved.destination)
				if (cancelled) {
					return { status: 'cancelled', reason: cancelled }
				}

				return { status: 'valid', destination: resolved.destination, href: resolved.href }
			} catch (error) {
				return { status: 'invalid-input', path: 'search', error }
			}
		}
		try {
			return await Promise.race([work(), cancellation])
		} finally {
			settings.signal?.removeEventListener('abort', abort)
			validations.delete(attempt)
		}
	}
	const prepare = async (
		input: unknown,
		settings: PrepareSettings = {},
		contextSource = options.context,
	): Promise<RoutePreparationResult> => {
		if (disposed) {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (settings.signal?.aborted) {
			return { status: 'cancelled', reason: 'aborted' }
		}
		const resolved = typeof input === 'string' ? resolveUrl(input) : resolveDestination(input)
		if (resolved.status !== 'matched') {
			return resolved
		}
		const transition = transitionProblem(resolved.destination)
		if (transition) {
			return transition
		}
		const controller = options.createCancellationController?.()
		let cancelled: CancelReason | undefined
		let finishCancellation!: (result: RoutePreparationResult) => void
		const cancellation = new Promise<RoutePreparationResult>((resolve) => {
			finishCancellation = resolve
		})
		const order = ++nextAttempt
		const keys = new Set<string>()
		const attempt = {
			cancel(reason: CancelReason) {
				if (cancelled) {
					return
				}
				cancelled = reason
				// A broken host abort hook must not prevent stale-result suppression.
				try {
					controller?.abort()
				} catch {
					/* cancellation still settles */
				}
				finishCancellation({ status: 'cancelled', reason })
			},
		}
		const claim = (stack: string) => {
			const key = keyFor(stack)
			if ((claimedOrder.get(key) ?? 0) > order) {
				attempt.cancel('superseded')
				return false
			}
			claimedOrder.set(key, order)
			if (pending.get(key) !== attempt) {
				pending.get(key)?.cancel('superseded')
			}
			keys.add(key)
			pending.set(key, attempt)
			return true
		}
		claim(resolved.destination.stack ?? 'root')
		const abort = () => attempt.cancel('aborted')
		settings.signal?.addEventListener('abort', abort, { once: true })
		if (settings.signal?.aborted) {
			abort()
		}
		const work = async (): Promise<RoutePreparationResult> => {
			let context: RoutePreparationArgs['context']
			try {
				const root = readContext(contextSource)
				context = dependencyRecord(root) ? root : await root
			} catch (error) {
				return { status: 'failed', phase: 'context', error }
			}
			let current = resolved
			let redirectStack: string | undefined
			for (let redirects = 0; redirects <= 16; redirects++) {
				if (cancelled) {
					return { status: 'cancelled', reason: cancelled }
				}

				const destination = current.destination
				const meta = metaFor(destination.to)!
				if (!claim(destination.stack ?? 'root')) {
					return { status: 'cancelled', reason: 'superseded' }
				}

				const behavior =
					behaviors.get(meta.name) ?? behaviors.get(destination.to) ?? meta.preparation

				let search: Record<string, unknown>
				try {
					const transition = transitionProblem(destination)
					if (transition) {
						return transition
					}

					search = await validateSearch(destination)
				} catch (error) {
					return { status: 'invalid-input', path: 'search', error }
				}

				if (cancelled) {
					return { status: 'cancelled', reason: cancelled }
				}

				const args: RoutePreparationArgs = {
					params: destination.params as Record<string, string>,
					search,
					context,
					signal: controller?.signal ?? settings.signal,
				}

				let phase: 'guard' | 'loader' = 'guard'
				let data: unknown
				try {
					for (const group of behavior?.groups ?? []) {
						phase = 'guard'
						const additional = await group.beforeLoad?.(args)
						if (additional !== undefined && !dependencyRecord(additional)) {
							throw new TypeError('Guard context must be a plain dependency object')
						}
						args.context = { ...args.context, ...additional }
						if (cancelled) {
							return { status: 'cancelled', reason: cancelled }
						}
						phase = 'loader'
						const parentData = await group.loader?.(args)
						if (cancelled) {
							return { status: 'cancelled', reason: cancelled }
						}
						args.context = { ...args.context, [group.id]: parentData }
					}
					phase = 'guard'
					const additional = await behavior?.beforeLoad?.(args)
					if (additional !== undefined && !dependencyRecord(additional)) {
						throw new TypeError('Guard context must be a plain dependency object')
					}

					args.context = { ...args.context, ...additional }
					if (cancelled) {
						return { status: 'cancelled', reason: cancelled }
					}

					phase = 'loader'
					data = await behavior?.loader?.(args)
				} catch (error) {
					if (cancelled) {
						return { status: 'cancelled', reason: cancelled }
					}

					if (error instanceof RouteResourceNotFound) {
						return { status: 'not-found', reason: 'resource' }
					}

					if (error instanceof RouteForbidden) {
						return { status: 'forbidden' }
					}

					let next: RouteDestinationInput | ValidatedDestination | undefined
					if (error instanceof DestinationRedirect) {
						next = error.destination
					}

					if (!next) {
						return { status: 'failed', phase, error }
					}

					const target = resolveDestination(next, destination.stack ?? 'root')
					if (target.status !== 'matched') {
						return target
					}

					redirectStack = explicitStacks.get(target) ?? redirectStack

					if (settings.redirects === 'return') {
						return { status: 'redirect', destination: target.destination }
					}

					current = target
					continue
				}

				if (cancelled) {
					return { status: 'cancelled', reason: cancelled }
				}

				const match: PreparedRouteMatch = {
					to: destination.to,
					name: meta.name,
					stack: destination.stack ?? 'root',
					params: args.params,
					search,
					context: args.context,
					data,
					href: current.href,
					hash: destination.hash,
					presentation: destination.presentation ?? meta.presentation,
					transition: destination.transition ?? meta.transition,
				}

				if (redirectStack !== undefined) {
					redirectStacks.set(match, redirectStack)
				}

				return {
					status: 'ready',
					redirected: redirects > 0,
					match,
				}
			}
			return {
				status: 'failed',
				phase: 'redirect',
				error: new Error('Route redirect limit exceeded'),
			}
		}
		try {
			return await Promise.race([work(), cancellation])
		} finally {
			settings.signal?.removeEventListener('abort', abort)
			for (const key of keys) {
				if (pending.get(key) === attempt) {
					pending.delete(key)
				}
			}
		}
	}
	const engine = {
		href,
		resolveUrl,
		resolveDestination: (input: unknown) => resolveDestination(input),
		validateDestination,
		prepare: (input: unknown, settings?: PrepareSettings) => prepare(input, settings),
		cancel(stack = 'root') {
			pending.get(keyFor(stack))?.cancel('aborted')
		},
		dispose(reason: CancelReason = 'disposed') {
			if (disposed) {
				return
			}
			disposed = true
			for (const attempt of new Set(pending.values())) {
				attempt.cancel(reason)
			}
			for (const attempt of validations) {
				attempt.cancel(reason)
			}
			validations.clear()
			pending.clear()
			claimedOrder.clear()
		},
	}
	preparationBatches.set(engine, () => {
		let snapshot: () => Record<string, unknown> | Promise<Record<string, unknown>> = () => {
			try {
				const value = readContext(options.context)
				snapshot = () => value
				return value
			} catch (error) {
				snapshot = () => {
					throw error
				}

				throw error
			}
		}
		return { prepare: (input, settings) => prepare(input, settings, () => snapshot()) }
	})
	return engine
}
