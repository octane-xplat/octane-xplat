import { rememberRouteDefinition } from './route-contract-scope'
import type {
	RouteContext,
	RouteGroup,
	RoutePreparationGroup,
	MergedRouteContext,
	RouteGuardResult,
	RouteDefinitionBuilder,
	RouteDefinitionInput,
	RouteDefinitionWithLoader,
	RoutePreparationArgs,
	RoutePreparationBehavior,
	RouteSearchValidator,
	RouteSearchSchema,
	RouteSearchRecord,
	DecodedRouteSearchSchema,
	RawRouteSearch,
} from '../props'

/** Adapt a scalar-input schema to decoded URL strings on every navigation path.
 * The decoder runs for links, direct URLs, history and search updates. It must
 * be pure; validation and defaults remain the schema's responsibility.
 * @example
 * import { withSearchDecoder } from '@octane-xplat/ui/routing'
 * import { pageSchema } from './schemas' // Application-owned scalar schema.
 * const validateSearch = withSearchDecoder(pageSchema, raw => ({ page: Number(raw.page ?? 1) }))
 */
export function withSearchDecoder<
	Input extends RouteSearchRecord,
	Output extends RouteSearchRecord,
>(
	schema: RouteSearchSchema<Input, Output> &
		(NoInfer<Input> extends {
			[Key in keyof Input]:
				| string
				| number
				| boolean
				| null
				| undefined
				| readonly (string | number | boolean)[]
		}
			? unknown
			: never),
	decode: (raw: RawRouteSearch) => NoInfer<Input>,
): DecodedRouteSearchSchema<Input, Output> {
	const standard = schema['~standard']
	return Object.freeze({
		'~standard': Object.freeze({
			...standard,
			validate: (raw: unknown) => standard.validate(decode(raw as RawRouteSearch)),
		}),
	}) as DecodedRouteSearchSchema<Input, Output>
}

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

function definitionsWithContext<Context extends object, Root = Context>(
	groups: readonly RoutePreparationGroup[] = [],
) {
	function define<
		const Path extends string,
		Validator extends RouteSearchValidator,
		Added extends RouteGuardResult = void,
		Data = unknown,
	>(
		definition: RouteDefinitionWithLoader<Path, Validator, Context, Added, Data> & {
			validateSearch: Validator
		} & RequiredGuard<RouteDefinitionInput<Path, Validator, Context, Added, Data>, Added>,
	): RouteDefinitionBuilder<Path, Validator, Context, Added, Data, Root>
	function define<const Path extends string, Added extends RouteGuardResult = void, Data = unknown>(
		definition: RouteDefinitionWithLoader<Path, undefined, Context, Added, Data> &
			RequiredGuard<RouteDefinitionInput<Path, undefined, Context, Added, Data>, Added>,
	): RouteDefinitionBuilder<Path, undefined, Context, Added, Data, Root>
	function define<
		const Path extends string,
		Validator extends RouteSearchValidator,
		Added extends RouteGuardResult = void,
	>(
		definition: RouteDefinitionInput<Path, Validator, Context, Added, undefined> & {
			validateSearch: Validator
			loader?: undefined
		} & RequiredGuard<RouteDefinitionInput<Path, Validator, Context, Added, undefined>, Added>,
	): RouteDefinitionBuilder<Path, Validator, Context, Added, undefined, Root>
	function define<const Path extends string, Added extends RouteGuardResult = void>(
		definition: RouteDefinitionInput<Path, undefined, Context, Added, undefined> & {
			loader?: undefined
		} & RequiredGuard<RouteDefinitionInput<Path, undefined, Context, Added, undefined>, Added>,
	): RouteDefinitionBuilder<Path, undefined, Context, Added, undefined, Root>
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
			groups,
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
	withContext: function withContext<Context extends Exclude<RouteGuardResult, void>>() {
		return definitionsWithContext<Context>()
	},
})

type GroupArgs<Context> = Omit<RoutePreparationArgs, 'context' | 'params'> & {
	context: Context
	params: Readonly<Record<string, string | undefined>>
}

type GroupInput<Id extends string, Context, Added, Data> = {
	id: Id
	beforeLoad?: (args: GroupArgs<Context>) => Added | Promise<Added>
	loader?: (args: GroupArgs<MergedRouteContext<Context, NoInfer<Added>>>) => Data
}

type GroupContext<Id extends string, Context, Added, Data> = MergedRouteContext<
	MergedRouteContext<Context, Added>,
	{ [Key in Id]: Awaited<Data> }
>

export type RouteGroupBuilder<Context extends object, Root> = RouteGroup<Context, Root> & {
	readonly route: ReturnType<typeof definitionsWithContext<Context, Root>>
	readonly group: ReturnType<typeof groupsWithContext<Context, Root>>
}

const routeGroups = new WeakMap<object, readonly RoutePreparationGroup[]>()

/** Internal identity check shared with file-derived catalogs. */
export function routeGroupPreparation(
	value: unknown,
): readonly RoutePreparationGroup[] | undefined {
	return value !== null && typeof value === 'object' ? routeGroups.get(value) : undefined
}

function groupsWithContext<Context extends object, Root = Context>(
	parents: readonly RoutePreparationGroup[] = [],
) {
	function group<const Id extends string, Added extends RouteGuardResult = void, Data = unknown>(
		input: GroupInput<Id, Context, Added, Data> & {
			loader: NonNullable<GroupInput<Id, Context, Added, Data>['loader']>
		} & RequiredGuard<GroupInput<Id, Context, Added, Data>, Added>,
	): RouteGroupBuilder<GroupContext<Id, Context, Added, Data>, Root>
	function group<const Id extends string, Added extends RouteGuardResult = void>(
		input: GroupInput<Id, Context, Added, undefined> & { loader?: undefined } & RequiredGuard<
				GroupInput<Id, Context, Added, undefined>,
				Added
			>,
	): RouteGroupBuilder<GroupContext<Id, Context, Added, undefined>, Root>
	function group(input: unknown): unknown {
		if (!input || typeof input !== 'object' || Array.isArray(input)) {
			throw new TypeError('Expected route group options')
		}
		const options = input as GroupInput<string, Context, RouteGuardResult, unknown>
		if (typeof options.id !== 'string' || !options.id.trim()) {
			throw new TypeError('Expected a non-empty route group id')
		}
		for (const field of ['beforeLoad', 'loader'] as const) {
			if (options[field] !== undefined && typeof options[field] !== 'function') {
				throw new TypeError('Expected a route group ' + field + ' callback')
			}
		}
		const groups = Object.freeze([
			...parents,
			Object.freeze({
				id: options.id,
				beforeLoad: options.beforeLoad as RoutePreparationBehavior['beforeLoad'],
				loader: options.loader as RoutePreparationBehavior['loader'],
			}),
		])
		const result = Object.freeze({
			route: definitionsWithContext<Context, Root>(groups),
			group: groupsWithContext<Context, Root>(groups),
		})
		routeGroups.set(result, groups)
		return result
	}
	return group
}

/** Prepare reusable parent scopes before a route. Each group's loader result
 * is available to descendants at context[group.id]. Groups rerun for every
 * preparation, including direct URLs, history and refresh.
 * @example
 * import { defineRouteGroup } from '@octane-xplat/ui/routing/core'
 * const account = defineRouteGroup({ id: 'account', loader: () => ({ name: 'Alex' }) })
 * const settings = account.route({ path: '/settings', loader: ({ context }) => context.account.name })
 */
export const defineRouteGroup = Object.assign(groupsWithContext<RouteContext>(), {
	withContext: function withContext<Context extends Exclude<RouteGuardResult, void>>() {
		return groupsWithContext<Context>()
	},
})
