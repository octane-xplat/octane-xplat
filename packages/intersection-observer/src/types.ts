/**
 * Shared contract for the cross-platform intersection observer. Mirrors the
 * DOM IntersectionObserver API where native allows; `root`/targets are
 * `unknown` because the bound object is an Element on web, a NativeScript
 * View on iOS/Android, or an AppKit NSView on macOS.
 */

/** Axis-aligned rectangle measured in CSS pixels on web, dips on iOS/Android,
 * or points on macOS. */
export interface IntersectionRect {
	x: number
	y: number
	width: number
	height: number
	top: number
	right: number
	bottom: number
	left: number
}

export interface IntersectionObserverEntry {
	/** The observed target (Element, NativeScript View, or AppKit NSView). */
	readonly target: unknown
	readonly time: number
	readonly isIntersecting: boolean
	readonly intersectionRatio: number
	readonly boundingClientRect: IntersectionRect
	readonly rootBounds: IntersectionRect | null
	readonly intersectionRect: IntersectionRect
}

/** Receives entries when a target crosses a configured threshold. */
export type IntersectionObserverCallback = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserverShape,
) => void

/** Options shared by the web and native observer implementations. */
export interface IntersectionObserverInit {
	/** Element (web), View (iOS/Android), or NSView (macOS) root.
	 *  Null/undefined = the platform viewport. On iOS/Android, pass a scroller
	 *  when its bounds should clip the result; ScrollView/ListView ancestors
	 *  are clipped automatically. macOS clips enclosing NSClipViews. */
	root?: unknown
	/** CSS margin shorthand, px (dips on iOS/Android, points on macOS) or %
	 *  of the root width. */
	rootMargin?: string
	threshold?: number | number[]
}

/** Methods and properties shared by all platform observer implementations. */
export interface IntersectionObserverShape {
	/** The configured root, or `null` when using the platform viewport. */
	readonly root: unknown | null
	/** The root bounds expansion or contraction used for intersection checks. */
	readonly rootMargin: string
	/** Sorted thresholds at which callbacks are delivered. */
	readonly thresholds: readonly number[]
	/** Begins observing a target. */
	observe(target: unknown): void
	/** Stops observing one target. */
	unobserve(target: unknown): void
	/** Stops observing all targets. */
	disconnect(): void
	/** Returns and clears entries queued for delivery. */
	takeRecords(): IntersectionObserverEntry[]
}

/** Constructor contract for the platform-specific observer value. */
export interface IntersectionObserverConstructor {
	new (
		callback: IntersectionObserverCallback,
		options?: IntersectionObserverInit,
	): IntersectionObserverShape
}

/** Options for `useIntersectionObserver`. */
export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
	/** Convenience sink invoked with the latest entry whenever the callback
	 *  would fire. */
	onChange?: (entry: IntersectionObserverEntry) => void
}

/** Bind callbacks and the latest entry returned by `useIntersectionObserver`. */
export interface UseIntersectionObserverResult {
	/** Pass to a target element's `bind` prop. */
	bind: (target: any) => void
	/** Pass to the scrolling container's `bind` prop to set `root`
	 *  declaratively. `options.root` takes precedence when both are set. */
	bindRoot: (root: any) => void
	/** Latest delivered entry, or null before the first notification. */
	entry: IntersectionObserverEntry | null
	isIntersecting: boolean
}
