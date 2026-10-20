import type {
	RouteTransitionContext,
	RouteTransitionResult,
	RouterHostResult,
	TransitionDefinition,
} from './props'

/** One transition coordinator per document host. The update is memoized because
 * skipTransition never cancels the browser's deferred update callback. */
export function createBrowserRouteTransitions(browser: Window) {
	let active: { skip(): void } | undefined
	const interrupt = () => {
		active?.skip()
		active = undefined
	}
	return {
		interrupt,
		async run(
			context: RouteTransitionContext,
			name: string | undefined,
			definition: TransitionDefinition | undefined,
			update: () => Promise<RouterHostResult>,
			cancellation?: Promise<Extract<RouterHostResult, { status: 'cancelled' }>>,
		): Promise<RouterHostResult> {
			interrupt()
			let updateTask: Promise<RouterHostResult> | undefined
			const commit = () => (updateTask ??= Promise.resolve().then(update))
			const direct = async (
				reason: 'disabled' | 'reduced-motion' | 'unsupported',
				error?: unknown,
			) => {
				const result = await commit()
				return result.status === 'committed'
					? {
							...result,
							finished: Promise.resolve<RouteTransitionResult>(
								error === undefined ? { status: 'skipped', reason } : { status: 'failed', error },
							),
						}
					: result
			}
			if (
				!name ||
				name === 'none' ||
				definition?.kind === 'skip' ||
				context.action === 'refresh' ||
				!context.from
			) {
				return direct('disabled')
			}
			if (definition && definition.kind !== 'web') {
				return direct('unsupported')
			}
			if (!definition && name !== 'default' && name !== 'fade') {
				return direct('unsupported')
			}
			if (
				definition?.options.reducedMotion !== 'allow' &&
				browser.matchMedia?.('(prefers-reduced-motion: reduce)').matches
			) {
				return direct('reduced-motion')
			}
			const document = browser.document
			if (!document.startViewTransition) {
				return direct('unsupported')
			}
			let types: readonly string[]
			try {
				const configured = definition?.options.types
				types = typeof configured === 'function' ? configured(context) : (configured ?? [])
			} catch (error) {
				return direct('unsupported', error)
			}
			let skipped: 'interrupted' | 'unsupported' | undefined
			let transition: ViewTransition
			let resolveUpdate!: (result: RouterHostResult) => void
			let rejectUpdate!: (error: unknown) => void
			const updated = new Promise<RouterHostResult>((resolve, reject) => {
				resolveUpdate = resolve
				rejectUpdate = reject
			})
			void updated.catch(() => {})
			try {
				// Use the Level 1 callback form even when typed transitions are absent.
				transition = document.startViewTransition(async () => {
					try {
						resolveUpdate(await commit())
					} catch (error) {
						rejectUpdate(error)
						throw error
					}
				})
			} catch (error) {
				return direct('unsupported', error)
			}
			const handle = {
				skip(reason: 'interrupted' | 'unsupported' = 'interrupted') {
					skipped ??= reason
					try {
						transition.skipTransition()
					} catch {
						/* motion cannot refuse a commit */
					}
				},
			}
			active = handle
			try {
				if (types.length) {
					if (!('types' in transition)) {
						handle.skip('unsupported')
					} else {
						for (const type of types) {
							transition.types.add(type)
						}
					}
				}
			} catch {
				handle.skip('unsupported')
			}
			const ready = transition.ready.then(
				() => true,
				() => false,
			)
			// A rejected animation is observed immediately, independently of commit.
			const finished = Promise.all([ready, transition.finished])
				.then(
					([animated]): RouteTransitionResult =>
						skipped || !animated
							? { status: 'skipped', reason: skipped ?? 'unsupported' }
							: { status: 'completed' },
					(error): RouteTransitionResult => ({ status: 'failed', error }),
				)
				.finally(() => {
					if (active === handle) {
						active = undefined
					}
				})
			void transition.updateCallbackDone.catch(() => {})
			const result = await (cancellation ? Promise.race([updated, cancellation]) : updated)
			if (result.status !== 'committed') {
				handle.skip()
				return result
			}
			return { ...result, finished }
		},
	}
}
