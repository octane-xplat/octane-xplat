import { rememberRouteDefinition } from './route-contract-scope'
import type {
	RouteContext,
	RouteGuardResult,
	RouteDefinitionBuilder,
	RouteDefinitionInput,
	RouteDefinitionWithLoader,
	RoutePreparationArgs,
	RoutePreparationBehavior,
	RouteSearchValidator,
} from './props'

/** Search diagnostics retain validation issues locally without logging raw input. */
export class RouteSearchValidationError extends Error {
	readonly issues: readonly { readonly message: string }[]
	constructor(issues: readonly { readonly message: string }[]) {
		super('Route search validation failed')
		this.name = 'RouteSearchValidationError'
		this.issues = issues
	}
}

/** Internal shared normalization for named files and programmatic definitions. */
export function routeSearchValidation(
	validator: RouteSearchValidator | undefined,
): RoutePreparationBehavior['validateSearch'] {
	if (!validator) {
		return undefined
	}
	// Callable schemas may expose a different ordinary call contract. Match the
	// type-level schema precedence instead of treating those values as parsers.
	const standard = '~standard' in validator ? validator['~standard'] : undefined
	return async (raw) => {
		if (standard?.version === 1 && typeof standard.validate === 'function') {
			const result = await standard.validate(raw)
			if (result.issues) {
				throw new RouteSearchValidationError(result.issues)
			}

			return result.value as Record<string, unknown>
		}
		if (typeof validator === 'function') {
			return (await validator(raw)) as Record<string, unknown>
		}
		throw new TypeError('Expected a search parser or Standard Schema v1 validator')
	}
}

type RequiredGuard<Input extends { beforeLoad?: unknown }, Added> = [Added] extends [void]
	? unknown
	: { beforeLoad: NonNullable<Input['beforeLoad']> }

function definitionsWithContext<Context extends Exclude<RouteGuardResult, void>>() {
	function define<
		const Path extends string,
		Validator extends RouteSearchValidator,
		Added extends RouteGuardResult = void,
		Data = unknown,
	>(
		definition: RouteDefinitionWithLoader<Path, Validator, Context, Added, Data> & {
			validateSearch: Validator
		} & RequiredGuard<RouteDefinitionInput<Path, Validator, Context, Added, Data>, Added>,
	): RouteDefinitionBuilder<Path, Validator, Context, Added, Data>
	function define<const Path extends string, Added extends RouteGuardResult = void, Data = unknown>(
		definition: RouteDefinitionWithLoader<Path, undefined, Context, Added, Data> &
			RequiredGuard<RouteDefinitionInput<Path, undefined, Context, Added, Data>, Added>,
	): RouteDefinitionBuilder<Path, undefined, Context, Added, Data>
	function define<
		const Path extends string,
		Validator extends RouteSearchValidator,
		Added extends RouteGuardResult = void,
	>(
		definition: RouteDefinitionInput<Path, Validator, Context, Added, undefined> & {
			validateSearch: Validator
			loader?: undefined
		} & RequiredGuard<RouteDefinitionInput<Path, Validator, Context, Added, undefined>, Added>,
	): RouteDefinitionBuilder<Path, Validator, Context, Added, undefined>
	function define<const Path extends string, Added extends RouteGuardResult = void>(
		definition: RouteDefinitionInput<Path, undefined, Context, Added, undefined> & {
			loader?: undefined
		} & RequiredGuard<RouteDefinitionInput<Path, undefined, Context, Added, undefined>, Added>,
	): RouteDefinitionBuilder<Path, undefined, Context, Added, undefined>
	function define(input: unknown): unknown {
		if (!input || typeof input !== 'object' || Array.isArray(input)) {
			throw new TypeError('Expected route preparation options')
		}
		if ('screen' in input) {
			throw new TypeError('Attach the screen with defineRoute(options).screen(component)')
		}
		const definition = input as RouteDefinitionInput<
			string,
			RouteSearchValidator | undefined,
			Context,
			RouteGuardResult,
			unknown
		>
		const preparation: RoutePreparationBehavior = Object.freeze({
			validateSearch: routeSearchValidation(definition.validateSearch),
			beforeLoad: definition.beforeLoad as RoutePreparationBehavior['beforeLoad'],
			loader: definition.loader as ((args: RoutePreparationArgs) => unknown) | undefined,
		})
		const captured = Object.freeze({
			path: definition.path,
			presentation: definition.presentation,
			transition: definition.transition,
			head: definition.head,
			errorBoundary: definition.errorBoundary,
			source: definition.source,
			preparation,
		})
		return Object.freeze({
			screen(component: unknown) {
				if (typeof component !== 'function') {
					throw new TypeError('Expected a route screen component')
				}
				return rememberRouteDefinition({ ...captured, screen: component })
			},
		})
	}
	return define
}

/** Infer preparation, then attach a screen with `.screen(component)` before
 * manifest assembly. Screen checking cannot change the inferred contract.
 * Standard Schema validators need no UI dependency. Declare inline validators,
 * guards and loaders in dependency order; earlier inputs remain conservative.
 * Use withContext<Context>() when guards/loaders consume typed root services.
 *
 * @example
 * import { defineRoute } from '@octane-xplat/ui/routing/core'
 * const route = defineRoute({ path: '/items/:id',
 *   loader: ({ params }) => ({ title: params.id }) })
 *   .screen(({ data }) => data.title)
 */
export const defineRoute = Object.assign(definitionsWithContext<RouteContext>(), {
	withContext: definitionsWithContext,
})
