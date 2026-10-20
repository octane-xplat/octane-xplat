import { buildRouteLocation, routePatternSegments } from '@octane-xplat/lib/route-pattern'
import type { RouteDestinationInput, ValidatedDestination } from './props'

// A weak identity proof has no router/context/services reference. Symbols make
// an attempted ordinary object copy recognizable; JSX receives the intact value.
const marker = Symbol('octane.validatedDestination')
const destinations = new WeakMap<
	object,
	{
		owner: object
		destination: RouteDestinationInput
	}
>()

function entry(value: unknown) {
	if (!value || typeof value !== 'object' || !(marker in value)) {
		return undefined
	}
	const result = destinations.get(value)
	if (!result) {
		throw new TypeError(
			'Use the original validated destination; copies and serialized values have no validation proof',
		)
	}
	return result
}

/** Internal factory; public code obtains handles only through its navigator. */
export function createValidatedDestination(
	destination: RouteDestinationInput,
	owner: object,
): ValidatedDestination {
	const search = Object.fromEntries(
		Object.entries(destination.search ?? {}).map(([key, value]) => [
			key,
			Array.isArray(value) ? Object.freeze([...value]) : value,
		]),
	)
	const snapshot = Object.freeze({
		...destination,
		params: Object.freeze({ ...destination.params }),
		search: Object.freeze(search),
	})
	const handle = Object.freeze({ [marker]: true })
	destinations.set(handle, { owner, destination: snapshot })
	return handle as unknown as ValidatedDestination
}

/** Only the issuing instance can consume its snapshot. The caller still runs
 * current matching, validation and guards; this is no authorization/cache token. */
export function resolveValidatedDestination(value: unknown, owner?: object): unknown {
	const checked = entry(value)
	if (!checked) {
		return value
	}
	if (checked.owner !== owner) {
		throw new TypeError('Validated destination belongs to a different router instance')
	}
	return checked.destination
}

/** Format the snapshot for its consuming scope. A removed plugin cannot make
 * a retained real anchor throw during rendering; activation rechecks existence. */
export function validatedDestinationHref(
	value: unknown,
	owner: object,
	options: { stack: string; base?: string },
): string | undefined {
	const checked = entry(value)
	if (!checked) {
		return undefined
	}
	if (checked.owner !== owner) {
		throw new TypeError('Validated destination belongs to a different router instance')
	}
	const destination = checked.destination
	const segments = routePatternSegments(destination.to)
	const stack = destination.stack ?? options.stack
	return buildRouteLocation(
		stack === 'root' ? segments : [stack, ...segments],
		destination.params,
		destination.search as import('@octane-xplat/lib/route-pattern').RouteSearchInput,
		destination.hash,
		options.base,
	)
}
