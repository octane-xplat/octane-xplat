import { createStore } from './store'
import type {
	NavigationBlockerState,
	NavigationDestinationSnapshot,
	RouterHostCommand,
} from './props'

/** @internal One token identifies a held attempt, never a mutable next-location slot. */
export interface NavigationBlockerAttempt {
	readonly action: RouterHostCommand['action']
	readonly destination: NavigationDestinationSnapshot | null
	readonly cancellation: Promise<unknown>
	readonly finished: Promise<void>
	isCurrent(): boolean
	cancel(): void
}

const idle = Object.freeze({ status: 'idle' } as const)

/** @internal Renderer-owned confirmation state; registration belongs to its effect. */
export function createNavigationBlocker() {
	const store = createStore<NavigationBlockerState>(idle)
	let current: { stop(): void } | undefined
	const publish = (state: NavigationBlockerState) => {
		try {
			store.set(Object.freeze(state))
		} catch {
			// A renderer observer must not leave an attempt waiting forever.
			console.warn('[octane-xplat] Navigation blocker observer threw')
		}
	}
	return {
		getSnapshot: store.getSnapshot,
		subscribe: store.subscribe,
		reset() {
			current?.stop()
		},
		request(attempt: NavigationBlockerAttempt): Promise<boolean> {
			if (!attempt.isCurrent()) {
				return Promise.resolve(false)
			}
			current?.stop()
			if (!attempt.isCurrent()) {
				return Promise.resolve(false)
			}
			let resolve!: (allowed: boolean) => void
			let decided = false
			const result = new Promise<boolean>((settle) => {
				resolve = settle
			})
			const request = {
				stop() {
					if (current !== request || decided) {
						return
					}
					current = undefined
					publish(idle)
					decided = true
					resolve(false)
					attempt.cancel()
				},
			}
			current = request
			const clear = () => {
				if (!decided) {
					decided = true
					resolve(false)
				}
				if (current === request) {
					current = undefined
					publish(idle)
				}
			}
			void Promise.race([attempt.cancellation, attempt.finished]).then(clear, clear)
			publish({
				status: 'blocked',
				action: attempt.action,
				destination: attempt.destination,
				proceed() {
					if (current !== request || decided || !attempt.isCurrent()) {
						return
					}
					decided = true
					publish({
						status: 'proceeding',
						action: attempt.action,
						destination: attempt.destination,
					})
					resolve(true)
				},
				reset() {
					if (!decided) {
						request.stop()
					}
				},
			})
			return result
		},
	}
}

export type NavigationBlocker = ReturnType<typeof createNavigationBlocker>
export interface NavigationBlockerBinding {
	readonly blocker: NavigationBlocker
	shouldBlock(): boolean
}

/** @internal Registrations are bound to the actual navigator, including modal flows. */
const bindings = new WeakMap<object, Set<NavigationBlockerBinding>>()

export function connectNavigationBlockers(navigator: object): () => void {
	if (bindings.has(navigator)) {
		throw new Error('Flow blockers are already connected')
	}
	const registry = new Set<NavigationBlockerBinding>()
	bindings.set(navigator, registry)
	return () => {
		if (bindings.get(navigator) !== registry) {
			return
		}
		bindings.delete(navigator)
		for (const binding of registry) {
			binding.blocker.reset()
		}
		registry.clear()
	}
}

export function registerNavigationBlocker(
	navigator: object,
	binding: NavigationBlockerBinding,
): () => void {
	const registry = bindings.get(navigator)
	if (!registry) {
		throw new Error('Navigation blocker requires a live canonical router flow')
	}
	registry.add(binding)
	return () => {
		if (!registry.delete(binding)) {
			return
		}
		binding.blocker.reset()
	}
}

export function hasNavigationBlockers(navigator: object): boolean {
	return [...(bindings.get(navigator) ?? [])].some((binding) => binding.shouldBlock())
}

export async function admitNavigationBlockers(
	navigator: object,
	attempt: NavigationBlockerAttempt,
): Promise<boolean> {
	const registry = bindings.get(navigator)
	if (!registry) {
		return attempt.isCurrent()
	}
	// The newest active registration confirms first; every active one agrees.
	for (const binding of [...registry].reverse()) {
		if (!attempt.isCurrent()) {
			return false
		}

		if (registry.has(binding) && binding.shouldBlock()) {
			if (!(await binding.blocker.request(attempt))) {
				return false
			}
		}
	}
	return attempt.isCurrent()
}
