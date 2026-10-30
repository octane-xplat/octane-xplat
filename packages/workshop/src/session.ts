/**
 * Session lifecycle core — host-agnostic.
 *
 * States: discovered → preparing → mounting → ready, with rebuilding,
 * failed, disposing, disconnected and restart-required. Every selection,
 * reset, or successful source edit starts a new generation; stale async
 * results are rejected by generation identity, and owned cleanup must
 * finish (within the disposal budget) before the next generation mounts.
 */
import { createStore, type Store } from '@octane-xplat/ui/data'
import type {
	CancellationSignal,
	FixtureContext,
	StoryDefinition,
	WorkshopTarget,
} from './contract'

import { WorkshopError, describeCause } from './errors'
import {
	Cancellation,
	DEFAULT_DISPOSAL_TIMEOUT,
	DEFAULT_FIXTURE_TIMEOUT,
	OwnedResources,
	createFixtureContext,
	withTimeout,
} from './fixture'

import { freshArgs, reconcileProps } from './controls'

export type SessionPhase =
	| 'discovered'
	| 'preparing'
	| 'mounting'
	| 'ready'
	| 'rebuilding'
	| 'failed'
	| 'disposing'
	| 'disconnected'
	| 'restart-required'

export interface SessionSnapshot {
	phase: SessionPhase
	/** The story currently selected (may differ from the mounted one while preparing). */
	storyId: string | null
	/** The generation that produced the visible stage. */
	mountedGeneration: number
	/** True when the visible stage is a previous successful revision. */
	stale: boolean
	/** Present when phase is 'failed' or 'restart-required'. */
	failure: WorkshopError | undefined
	/** Number of successful mounts so far. */
	revision: number
}

export interface MountRequest {
	/** The story definition being mounted. */
	story: StoryDefinition<any, any, any>
	/** The component to render. */
	component: (props: any) => unknown
	/** Resolved props for this generation. */
	props: Record<string, unknown>
	/** Ordered provider wrappers applied around the component. */
	providers: readonly unknown[]
	/** The settled fixture value for this generation. */
	fixture: unknown
	/** Aborted when the generation retires — mount work must stop. */
	signal: CancellationSignal
	/** Render-failure callback reported by the host boundary. */
	onRenderError: (error: unknown) => void
}

export interface MountedStory {
	/** Push updated props into the mounted story. */
	update(props: Record<string, unknown>): void
	/** Tear down the mounted story; may be async. */
	unmount(): void | Promise<void>
}

/** Host adapter seam — the web adapter supplies createRoot mounting. */
export interface StageHost {
	/** Mount a generation's story into the host stage. */
	mount(request: MountRequest): MountedStory | Promise<MountedStory>
}

interface SessionOptions {
	host: StageHost
	target: WorkshopTarget
	globalProviders?: readonly unknown[]
	onChange?: (snapshot: SessionSnapshot) => void
	disposalTimeout?: number
}

interface DisposalResult {
	ok: boolean
	timedOut: boolean
	errors: unknown[]
}

interface Generation {
	id: number
	story: StoryDefinition<any, any, any>
	cancellation: Cancellation
	resources: OwnedResources
	fixture: unknown
	store: Store<unknown> | undefined
	mounted: MountedStory | undefined
	props: Record<string, unknown>
	retirement?: Promise<DisposalResult>
	mounting?: Promise<MountedStory>
	/** The boundary reported a render failure for this generation. */
	failed: boolean
}

export class WorkshopSession {
	private readonly options: SessionOptions
	private generation = 0
	private blockedFailure: WorkshopError | undefined
	private current: Generation | undefined
	private snapshot: SessionSnapshot = {
		phase: 'discovered',
		storyId: null,
		mountedGeneration: 0,
		stale: false,
		failure: undefined,
		revision: 0,
	}
	private readonly listeners = new Set<(snapshot: SessionSnapshot) => void>()

	constructor(options: SessionOptions) {
		this.options = options
	}

	get state(): SessionSnapshot {
		return this.snapshot
	}

	get target(): WorkshopTarget {
		return this.options.target
	}

	/** The story definition backing the current generation, if any. */
	get currentStory(): StoryDefinition<any, any, any> | undefined {
		return this.current?.story
	}

	/** The current generation's complete props bag (args + applied controls). */
	get currentProps(): Record<string, unknown> | undefined {
		return this.current?.props
	}

	subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
		this.listeners.add(listener)
		listener(this.snapshot)
		return () => this.listeners.delete(listener)
	}

	private emit(patch: Partial<SessionSnapshot>): void {
		this.snapshot = {
			...this.snapshot,
			...patch,
			...(this.blockedFailure
				? {
						phase: 'restart-required' as const,
						failure: this.blockedFailure,
						stale: false,
					}
				: {}),
		}

		for (const listener of this.listeners) {
			listener(this.snapshot)
		}

		this.options.onChange?.(this.snapshot)
	}

	private fail(error: WorkshopError, stale = false): void {
		this.emit({ phase: 'failed', failure: error, stale })
	}

	/** Begin a fresh run of `story`; any prior generation is retired first. */
	async select(
		story: StoryDefinition<any, any, any>,
		mode: 'select' | 'reset' | 'rebuild' = 'select',
	): Promise<void> {
		if (this.blockedFailure) {
			return
		}

		const id = ++this.generation
		const gen: Generation = {
			id,
			story,
			cancellation: new Cancellation(),
			resources: new OwnedResources((error) => {
				this.blockedFailure = new WorkshopError(
					'cleanup',
					`Late resource cleanup failed — restart the workshop target: ${describeCause(error)}`,
					{ storyId: story.id },
				)

				this.emit({ phase: 'restart-required' })
			}, this.options.disposalTimeout ?? DEFAULT_DISPOSAL_TIMEOUT),
			fixture: undefined,
			store: undefined,
			mounted: undefined,
			props: {},
			failed: false,
		}

		const previous = this.current
		if (previous !== undefined) {
			this.emit({ phase: 'disposing', storyId: story.id })
			const disposal = await this.retire(previous)
			if (id !== this.generation) {
				return // a newer selection superseded this one mid-disposal
			}

			if (!disposal.ok) {
				return
			}
		}

		this.current = gen
		this.emit({
			phase: mode === 'rebuild' ? 'rebuilding' : 'preparing',
			storyId: story.id,
			stale: false,
			failure: undefined,
		})

		try {
			if (typeof story.state === 'function') {
				gen.store = createStore(story.state()) as Store<unknown>
			}

			if (typeof story.fixture === 'function') {
				const timeout = story.fixtureTimeout ?? DEFAULT_FIXTURE_TIMEOUT
				const context: FixtureContext = createFixtureContext(
					this.options.target,
					story.capabilities ?? [],
					gen.cancellation,
					gen.resources,
				)

				let produced: Promise<unknown>
				try {
					produced = Promise.resolve(story.fixture(context))
				} catch (error) {
					throw new WorkshopError('fixture', `fixture threw: ${describeCause(error)}`, {
						storyId: story.id,
						cause: error,
					})
				}

				gen.fixture = await withTimeout(
					Promise.race([produced, gen.cancellation.promise]),
					timeout,
					() => gen.cancellation.cancel(),
				)
			}
		} catch (error) {
			// Preparation failure: unwind everything registered so far.
			const disposal = await this.retire(gen)
			if (!disposal.ok) {
				return
			}

			if (id !== this.generation) {
				return
			}

			const wrapped =
				error instanceof WorkshopError
					? error
					: new WorkshopError('fixture', `fixture rejected or timed out: ${describeCause(error)}`, {
							storyId: story.id,
							cause: error,
						})

			this.fail(wrapped)
			return
		}

		if (id !== this.generation || this.blockedFailure) {
			// Late success on a cancelled generation: its owned resources are
			// still released exactly once.
			await this.retire(gen)
			return
		}

		this.emit({ phase: 'mounting', storyId: story.id })
		gen.props = freshArgs(story.args ?? {})
		try {
			gen.mounting = Promise.resolve(
				this.options.host.mount({
					story,
					component: story.component,
					props: this.injectedProps(gen, gen.props),
					providers: [...(this.options.globalProviders ?? []), ...(story.providers ?? [])],
					fixture: gen.fixture,
					signal: gen.cancellation,
					onRenderError: (error) => {
						if (gen.id === this.generation) {
							// Awaited mounts yield to microtasks — mark so the 'ready'
							// emit below does not overwrite this failure.
							gen.failed = true
							this.fail(
								new WorkshopError('mount', `render failed: ${describeCause(error)}`, {
									storyId: story.id,
									cause: error,
								}),
							)

							void this.retire(gen)
						}
					},
				}),
			)

			gen.mounted = await gen.mounting
		} catch (error) {
			const disposal = await this.retire(gen)
			if (!disposal.ok) {
				return
			}

			if (id !== this.generation) {
				return
			}

			this.fail(
				new WorkshopError('mount', `mount failed: ${describeCause(error)}`, {
					storyId: story.id,
					cause: error,
				}),
			)

			return
		}

		if (id !== this.generation) {
			await this.retire(gen)
			return
		}

		if (gen.failed) {
			// The boundary already reported the render failure for this mount.
			return
		}

		this.emit({
			phase: 'ready',
			storyId: story.id,
			mountedGeneration: id,
			stale: false,
			failure: undefined,
			revision: this.snapshot.revision + 1,
		})
	}

	private injectedProps(gen: Generation, props: Record<string, unknown>): Record<string, unknown> {
		const merged = { ...props }
		if (gen.store !== undefined) {
			merged.state = gen.store
		}

		if (typeof gen.story.fixture === 'function') {
			merged.fixture = gen.fixture
		}

		return merged
	}

	/**
	 * Apply the complete next props bag — controls preserve the current
	 * fixture, providers, store and component-local state. Removed keys are
	 * forwarded as explicit `undefined`.
	 */
	applyProps(next: Record<string, unknown>): void {
		const gen = this.current
		if (!gen?.mounted || this.snapshot.phase !== 'ready') {
			return
		}

		const reconciled = reconcileProps(gen.props, next)
		gen.props = next
		gen.mounted.update(this.injectedProps(gen, reconciled))
	}

	/** A full fresh run: fresh args, fresh store, fresh fixture, fresh root. */
	async reset(): Promise<void> {
		const story = this.current?.story
		if (!story) {
			return
		}

		await this.select(story, 'reset')
	}

	/** A successful source edit remounts the selected story revision. */
	async reload(next: StoryDefinition<any, any, any>): Promise<void> {
		await this.select(next, 'rebuild')
	}

	/** A source edit is in flight; the next success remounts. */
	markRebuilding(): void {
		if (this.snapshot.phase === 'ready') {
			this.emit({ phase: 'rebuilding', stale: true })
		}
	}

	/** A failed source edit keeps the last successful stage, visibly stale. */
	markCompileError(error: unknown): void {
		this.emit({
			phase: 'failed',
			stale: this.snapshot.mountedGeneration > 0,
			failure: new WorkshopError('compile', `source update failed: ${describeCause(error)}`, {
				storyId: this.snapshot.storyId ?? undefined,
				cause: error,
			}),
		})
	}

	markDisconnected(): void {
		this.emit({ phase: 'disconnected' })
	}

	/** Back to live after a disconnect notice. */
	markConnected(): void {
		if (this.snapshot.phase === 'disconnected') {
			this.emit({ phase: this.current?.mounted ? 'ready' : 'discovered' })
		}
	}

	/** Retire a generation: cancel, unmount, run owned cleanups (all of them). */
	private retire(gen: Generation): Promise<DisposalResult> {
		if (gen.retirement) {
			return gen.retirement
		}

		// Cache one retirement promise so concurrent selections await the same
		// cleanup rather than treating an in-flight retirement as completed.
		gen.retirement = Promise.resolve().then(() => this.disposeGeneration(gen))
		return gen.retirement
	}

	private async disposeGeneration(gen: Generation): Promise<DisposalResult> {
		gen.cancellation.cancel()
		const unmount = (async (): Promise<unknown[]> => {
			// An asynchronous host may acquire its root after cancellation.
			// Keep that acquisition inside the disposal budget and own its root.
			let mounted = gen.mounted
			if (!mounted && gen.mounting) {
				try {
					mounted = await gen.mounting
				} catch {
					/* mount failed */
				}
			}

			if (mounted) {
				try {
					await mounted.unmount()
				} catch (error) {
					return [error]
				}
			}

			return []
		})()

		// Start all owned disposal even when a root unmount is asynchronous or
		// hung. The next generation still awaits the combined acknowledgement.
		const work = Promise.all([unmount, gen.resources.dispose()]).then(([errors, resources]) => ({
			errors: [...errors, ...resources.errors],
		}))

		let timedOut = false
		const result = await withTimeout(
			work,
			this.options.disposalTimeout ?? DEFAULT_DISPOSAL_TIMEOUT,
			() => {
				timedOut = true
			},
		).catch((error) => ({ errors: [error] }))

		const disposal = {
			ok: !timedOut && result.errors.length === 0,
			timedOut,
			errors: result.errors,
		}

		if (!disposal.ok) {
			this.blockedFailure = new WorkshopError(
				'cleanup',
				timedOut
					? 'Owned cleanup timed out — restart the workshop target'
					: `Owned cleanup failed — restart the workshop target: ${result.errors.map(describeCause).join('; ')}`,
				{ storyId: gen.story.id },
			)

			this.emit({ phase: 'restart-required' })
		}

		return disposal
	}

	/** Dispose the session entirely (server shutdown / target restart). */
	async dispose(): Promise<void> {
		const id = ++this.generation
		const previous = this.current
		if (previous) {
			await this.retire(previous)
			if (this.current === previous) {
				this.current = undefined
			}
		}

		if (id === this.generation && !this.blockedFailure) {
			this.emit({
				phase: 'discovered',
				storyId: null,
				mountedGeneration: 0,
				stale: false,
				failure: undefined,
			})
		}
	}
}
