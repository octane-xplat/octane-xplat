/**
 * Shared contract for the cross-platform intersection observer. Mirrors the
 * DOM IntersectionObserver API where native allows; `root`/targets are
 * `unknown` because the bound object is an Element on web, a NativeScript
 * View on iOS/Android, or an AppKit NSView on macOS.
 */

/** Axis-aligned rectangle measured in CSS pixels on web, dips on iOS/Android,
 * or points on macOS. */
export interface IntersectionRect {
	/** Distance from the root's left edge. */
	x: number
	/** Distance from the root's top edge. */
	y: number
	/** Rectangle width — 0 for zero-area intersections. */
	width: number
	/** Rectangle height — 0 for zero-area intersections. */
	height: number
	/** Top edge coordinate — same value as `y` (DOMRect parity). */
	top: number
	/** Right edge coordinate — `x + width`. */
	right: number
	/** Bottom edge coordinate — `y + height`. */
	bottom: number
	/** Left edge coordinate — same value as `x` (DOMRect parity). */
	left: number
}

/** One observation record — delivered to the callback when a configured
 *  threshold is crossed. */
export interface IntersectionObserverEntry {
	/** The observed target (Element, NativeScript View, or AppKit NSView). */
	readonly target: unknown
	/** Milliseconds on the platform's monotonic clock when measured —
	 *  comparable between entries, not a wall-clock timestamp. */
	readonly time: number
	/** Whether the target currently meets the root, computed at the
	 *  configured thresholds — edge-touching counts as intersecting. */
	readonly isIntersecting: boolean
	/** Visible fraction of the target, 0–1. */
	readonly intersectionRatio: number
	/** The target's rect in root coordinates. */
	readonly boundingClientRect: IntersectionRect
	/** The root's rect after rootMargin is applied; null for the viewport
	 *  root on platforms that don't expose it. */
	readonly rootBounds: IntersectionRect | null
	/** The visible overlap — empty rect when not intersecting. */
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
	/** Ratio cutoffs (0-1) that trigger delivery; 0 = any edge crossing. */
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
	/** Pass to a target element's `ref` prop. */
	ref: (target: any) => void
	/** Pass to the scrolling container's `ref` prop to set `root`
	 *  declaratively. `options.root` takes precedence when both are set. */
	rootRef: (root: any) => void
	/** Latest delivered entry, or null before the first notification. */
	entry: IntersectionObserverEntry | null
	/** Shorthand for `entry?.isIntersecting ?? false`. */
	isIntersecting: boolean
}
