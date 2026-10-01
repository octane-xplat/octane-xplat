// IntersectionObserver — AppKit leaf. The macOS renderer has no scroll-event
// seam to re-evaluate against yet, so this is an inert stub matching the
// tiptap/geolocation `supported=false` convention.
import type { IntersectionObserverEntry } from './types'

/** Whether observation is available on the current platform. */
export const supported = false

/** Inert observer matching the shared API on the AppKit host. */
export class IntersectionObserver {
	readonly root = null
	readonly rootMargin = '0px'
	readonly thresholds = [0] as const
	constructor(_callback: unknown, _options?: unknown) {}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return []
	}
}
