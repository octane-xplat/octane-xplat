/**
 * @octane-xplat/workshop — typed authoring contract.
 *
 * One `defineStory` declaration describes an isolated development run of an
 * Octane component: stable identity, target applicability, default args,
 * explicit controls, fresh state, a cancellable async fixture, and ordered
 * provider wrappers. The story file compiles under the consumer's normal
 * renderer rules; this module carries no renderer or host globals itself.
 */
import type { Store } from '@octane-xplat/ui'

/** The six product targets. Only `web` is qualified by the current release. */
export type WorkshopTarget = 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux'

export const WORKSHOP_TARGETS: readonly WorkshopTarget[] = [
	'web',
	'ios',
	'android',
	'macos',
	'windows',
	'linux',
]

/** Version of the authoring contract — bumped on breaking changes. */
export const WORKSHOP_CONTRACT_VERSION = 1

export type StoryTargets = 'all' | readonly WorkshopTarget[]

/**
 * Portable cancellation contract for fixture work. The host adapter supplies
 * an implementation with equivalent observable semantics — do not rely on
 * `AbortController`/`signal.throwIfAborted` being the underlying mechanism.
 */
export interface CancellationSignal {
	readonly aborted: boolean
	addEventListener(type: 'abort', listener: () => void): void
	removeEventListener(type: 'abort', listener: () => void): void
}

export type StoryCleanup = () => void | Promise<void>

/** Context handed to the fixture factory for each story generation. */
export interface FixtureContext {
	/** The real target this run mounts on. */
	readonly target: WorkshopTarget
	/** Capabilities declared by the story. */
	readonly capabilities: readonly string[]
	/** Observable cancellation; aborted when the generation retires. */
	readonly signal: CancellationSignal
	/**
	 * Register an owned resource for disposal. Disposal runs exactly once —
	 * including for resources registered after cancellation, which are
	 * released as soon as the fixture settles.
	 */
	onCleanup(cleanup: StoryCleanup): void
}

export type FixtureFactory<F> = (context: FixtureContext) => F | Promise<F>

/** A compiler-produced Octane component. Kept opaque to transport/tooling. */
export type StoryComponent<P> = (props: P) => unknown

/**
 * An ordered provider wrapper. Consumer presets wrap story providers;
 * each receives the typed fixture result and `children`.
 */
export type StoryProvider<F> = (props: { fixture: F; children?: unknown }) => unknown

export interface BooleanControl {
	type: 'boolean'
}

export interface StringControl {
	type: 'string'
	placeholder?: string
}

export interface NumberControl {
	type: 'number'
	min?: number
	max?: number
	step?: number
}

export interface EnumControl<T> {
	type: 'enum'
	options: readonly T[]
}

type ControlValue<T> = 0 extends (1 & T)
	? BooleanControl | NumberControl | StringControl | EnumControl<T>
	: [T] extends [boolean]
	? BooleanControl
	: [T] extends [number]
		? NumberControl | EnumControl<T>
		: [T] extends [string]
			? StringControl | EnumControl<T>
			: never

/**
 * Controls may be declared only for explicitly declared, portable-valued
 * props. `allowUnset` is legal only on optional props — Unset removes the
 * key from the next props bag rather than merging a stale value.
 */
export type StoryControl<T, Optional extends boolean> = ControlValue<T> &
	(Optional extends true ? { allowUnset?: boolean } : { allowUnset?: false })

export type StoryControls<P> = {
	[K in keyof P]?: StoryControl<NonNullable<P[K]>, undefined extends P[K] ? true : false>
}

/** Props the runner injects beyond `args`: fresh state store + fixture. */
export type InjectedStoryProps<S, F> = (S extends void ? unknown : { state: Store<S> }) &
	(F extends void ? unknown : { fixture: F })

type ReservedStoryKeys = 'state' | 'fixture'

/** Reserved injected prop names cannot collide with declared props. */
type PropsWithoutReserved<P> = Extract<
	keyof P,
	ReservedStoryKeys
> extends never
	? P
	: never

/**
 * A complete story declaration. `id`, `title`, `targets`, and `capabilities`
 * must be literal values — discovery reads them statically without
 * evaluating the module.
 */
export type StoryDefinition<P = Record<string, never>, S = void, F = void> = {
	/** Stable, unique story id — e.g. 'account/profile-card'. */
	id: string
	/** Display title; '/' segments group the catalog. */
	title: string
	/** Targets this story can mount on; 'all' covers the six product targets. */
	targets: StoryTargets
	/** Host capabilities the story requires (e.g. 'camera', 'network-write'). */
	capabilities?: readonly string[]
	/** The component under development. */
	component: StoryComponent<PropsWithoutReserved<P> & InjectedStoryProps<S, F>>
	/** Immutable default props for each run; cloned fresh per generation. */
	args: PropsWithoutReserved<P>
	/** Explicit editable inputs for declared props. */
	controls?: StoryControls<P>
	/** Fixture preparation budget in milliseconds; defaults to 10 000. */
	fixtureTimeout?: number
	/** Ordered wrappers applied around the component for each generation. */
	providers?: readonly StoryProvider<F extends void ? undefined : F>[]
} & (S extends void ? { state?: never } : { state: () => S }) &
	(F extends void ? { fixture?: never } : { fixture: FixtureFactory<F> })

/** Declare a story. Validates cheap authoring rules eagerly. */
export function defineStory<P = Record<string, never>, S = void, F = void>(
	definition: StoryDefinition<P, S, F>,
): StoryDefinition<P, S, F> {
	assertLiteralAuthoring(definition)
	return definition
}

function assertLiteralAuthoring(definition: StoryDefinition<any, any, any>): void {
	const fail = (message: string): never => {
		throw new Error(`defineStory: ${message}`)
	}

	if (typeof definition?.id !== 'string' || !definition.id) {
		fail('a story requires a non-empty string id')
	}

	if (typeof definition.title !== 'string' || !definition.title) {
		fail(`story "${definition.id}" requires a non-empty string title`)
	}

	const targets = definition.targets
	const valid =
		targets === 'all' ||
		(Array.isArray(targets) &&
			targets.length > 0 &&
			targets.every((t) => WORKSHOP_TARGETS.includes(t)))

	if (!valid) {
		fail(
			`story "${definition.id}" — targets must be 'all' or a subset of: ${WORKSHOP_TARGETS.join(', ')}`,
		)
	}

	if (typeof definition.component !== 'function') {
		fail(`story "${definition.id}" — component must be an Octane component`)
	}

	if (definition.args == null || typeof definition.args !== 'object') {
		fail(`story "${definition.id}" — args must be an object`)
	}

	if ('state' in definition && typeof definition.state !== 'function') {
		fail(`story "${definition.id}" — state must be a factory function`)
	}

	if ('fixture' in definition && typeof definition.fixture !== 'function') {
		fail(`story "${definition.id}" — fixture must be a factory function`)
	}

	if (definition.args && typeof definition.args === 'object') {
		for (const key of ['state', 'fixture'] as const) {
			if (key in definition.args) {
				fail(
					`story "${definition.id}" — args may not declare reserved injected prop "${key}"`,
				)
			}
		}
	}

	if (definition.controls) {
		for (const [key, control] of Object.entries(definition.controls)) {
			if (!control || typeof control !== 'object') {
				fail(`story "${definition.id}" — control "${key}" must be an object`)
			}

			const type = (control as { type?: string }).type
			if (!['boolean', 'string', 'number', 'enum'].includes(type ?? '')) {
				fail(
					`story "${definition.id}" — control "${key}" has unknown type "${type}" (expected boolean, string, number or enum)`,
				)
			}

			if (type === 'enum' && !Array.isArray((control as EnumControl<unknown>).options)) {
				fail(`story "${definition.id}" — enum control "${key}" requires an options array`)
			}

			if (
				type === 'number' &&
				typeof (control as NumberControl).min === 'number' &&
				typeof (control as NumberControl).max === 'number' &&
				(control as NumberControl).min! > (control as NumberControl).max!
			) {
				fail(`story "${definition.id}" — number control "${key}" has min > max`)
			}
		}
	}

	if (definition.providers !== undefined && !Array.isArray(definition.providers)) {
		fail(`story "${definition.id}" — providers must be an array`)
	}
}

/** Consumer workshop configuration, loaded by the dev tooling. */
export interface WorkshopConfig {
	stories?: {
		/** Glob(s) matching story modules. Default: '**&#47;*.stories.{ts,tsx,tsrx}' plus platform-suffixed leaves. */
		include?: string | readonly string[]
		exclude?: string | readonly string[]
	}
	/**
	 * Module specifiers (relative to the config file) whose `providers` or
	 * `default` export is an array of provider components wrapping every story.
	 */
	providerModules?: readonly string[]
	/** Extra static asset roots served under /@workshop-assets/<name>/. */
	assets?: Record<string, string>
}

export function defineWorkshopConfig(config: WorkshopConfig): WorkshopConfig {
	return config
}
