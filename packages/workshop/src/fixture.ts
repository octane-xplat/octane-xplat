/**
 * Owned-resource and cancellation machinery for one story generation.
 * Host-agnostic: no DOM globals, no AbortController — the portable
 * CancellationSignal contract only.
 */
import type { CancellationSignal, FixtureContext, StoryCleanup, WorkshopTarget } from './contract'

/** The default fixture preparation budget (per-story override: fixtureTimeout). */
export const DEFAULT_FIXTURE_TIMEOUT = 10_000
/** Bound on owned cleanup before declaring a restart-required state. */
export const DEFAULT_DISPOSAL_TIMEOUT = 10_000

/** Rejection used to interrupt awaits when a generation is cancelled. */
export class CancelledError extends Error {
	constructor() {
		super('workshop generation cancelled')
		this.name = 'CancelledError'
	}
}

export class Cancellation implements CancellationSignal {
	aborted = false
	private readonly listeners = new Set<() => void>()
	private rejectPromise: ((error: Error) => void) | undefined

	/** Rejects as soon as this generation is cancelled — race it against
	 *  fixture work so a superseded selection never waits for a dead run. */
	readonly promise: Promise<never> = new Promise<never>((_resolve, reject) => {
		this.rejectPromise = reject
	})

	constructor() {
		// Cancellation can land while nothing is racing the promise — keep it
		// counted as handled so it never reports an unhandled rejection.
		this.promise.catch(() => {})
	}

	cancel(): void {
		this.rejectPromise?.(new CancelledError())
		if (this.aborted) {
			return
		}

		this.aborted = true
		for (const listener of this.listeners) {
			try {
				listener()
			} catch {
				// Listener failures must not stop sibling notifications.
			}
		}

		this.listeners.clear()
	}

	addEventListener(_type: 'abort', listener: () => void): void {
		if (this.aborted) {
			listener()
			return
		}

		this.listeners.add(listener)
	}

	removeEventListener(_type: 'abort', listener: () => void): void {
		this.listeners.delete(listener)
	}
}

/**
 * Resources a fixture or provider registered for cleanup. Disposal runs each
 * cleanup exactly once, attempts every entry even after a failure, and —
 * after settle() — immediately disposes anything registered late (a fixture
 * that ignored cancellation still has its resources released).
 */
export class OwnedResources {
	private readonly cleanups: StoryCleanup[] = []
	private settled = false
	private pending = Promise.resolve()
	constructor(
		private readonly onLateFailure?: (error: unknown) => void,
		private readonly lateTimeout: number = DEFAULT_DISPOSAL_TIMEOUT,
	) {}

	readonly failures: { cleanup: StoryCleanup; error: unknown }[] = []

	register(cleanup: StoryCleanup): void {
		if (this.settled) {
			// Registered after cancellation/settlement: dispose exactly once, now.
			this.pending = Promise.all([this.pending, this.runOne(cleanup, true)]).then(() => {})
			return
		}

		this.cleanups.push(cleanup)
	}

	private async runOne(cleanup: StoryCleanup, late = false): Promise<void> {
		try {
			const work = cleanup()
			await (late ? withTimeout(Promise.resolve(work), this.lateTimeout, () => {}) : work)
		} catch (error) {
			this.failures.push({ cleanup, error })
			if (late) {
				this.onLateFailure?.(error)
			}
		}
	}

	/** Unwind in reverse registration order; every entry is attempted. */
	async dispose(): Promise<{ errors: unknown[] }> {
		this.settled = true
		const entries = this.cleanups.splice(0)
		// Start every cleanup in reverse ownership order. A hung cleanup must
		// not prevent siblings from being attempted before the global timeout.
		await Promise.all(entries.reverse().map((cleanup) => this.runOne(cleanup)))

		await this.pending
		return { errors: this.failures.map((f) => f.error) }
	}
}

export function createFixtureContext(
	target: WorkshopTarget,
	capabilities: readonly string[],
	cancellation: Cancellation,
	resources: OwnedResources,
): FixtureContext {
	return {
		target,
		capabilities,
		signal: cancellation,
		onCleanup: (cleanup) => resources.register(cleanup),
	}
}

/** Race a value/promise against a budget; calls onTimeout before rejecting. */
export async function withTimeout<T>(
	value: T | Promise<T>,
	ms: number,
	onTimeout: () => void,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined
	try {
		return await Promise.race([
			Promise.resolve(value),
			new Promise<never>((_resolve, reject) => {
				timer = setTimeout(() => {
					onTimeout()
					reject(new Error(`timed out after ${ms}ms`))
				}, ms)
			}),
		])
	} finally {
		if (timer !== undefined) {
			clearTimeout(timer)
		}
	}
}
