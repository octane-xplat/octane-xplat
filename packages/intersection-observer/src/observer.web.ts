// IntersectionObserver — web leaf. The DOM implementation is the contract
// this package mirrors; re-export it under the shared types so every target
// presents the same surface.
import type { IntersectionObserverConstructor } from './types'

const NativeObserver = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver

/** Whether the current web host provides the DOM IntersectionObserver API. */
export const supported = typeof NativeObserver === 'function'

/** Non-DOM hosts (test runners, SSR): observe() records nothing and no
 *  entries are ever delivered. Callers can check `supported` first. */
class UnsupportedObserver {
	readonly root = null
	readonly rootMargin = '0px'
	readonly thresholds = [0] as const
	constructor(_callback: unknown, _options?: unknown) {}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
	takeRecords() {
		return []
	}
}

/** The browser's DOM IntersectionObserver, or an inert non-DOM host stub. */
export const IntersectionObserver = (
	supported ? NativeObserver : UnsupportedObserver
) as IntersectionObserverConstructor
