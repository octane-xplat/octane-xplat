// IntersectionObserver — native leaf (iOS + Android share one implementation).
// NativeScript has no IntersectionObserver; geometry is measured portably in
// screen-space DIPs via getLocationOnScreen()/getActualSize() and clipped by
// the bounds of ancestors that clip on both OSes (ScrollView, ListView) plus
// the root. Re-evaluation runs on `scroll`/`layoutChanged` events up the
// ancestor chain — the approach @nativescript-use/nativescript-intersection
// -observer uses on a single parent, generalized to every ancestor and
// extended with thresholds and rootMargin.
import { ListView, Screen, ScrollView, View } from '@nativescript/core'
import type {
	IntersectionObserverCallback,
	IntersectionObserverEntry,
	IntersectionObserverInit,
	IntersectionObserverShape,
	IntersectionRect,
} from './types'

/** Whether geometry-backed observation is available on iOS and Android. */
export const supported = true

interface Margin {
	top: number
	right: number
	bottom: number
	left: number
}

function rect(x: number, y: number, width: number, height: number): IntersectionRect {
	return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x }
}

function intersect(a: IntersectionRect, b: IntersectionRect): IntersectionRect | null {
	const left = Math.max(a.left, b.left)
	const top = Math.max(a.top, b.top)
	const right = Math.min(a.right, b.right)
	const bottom = Math.min(a.bottom, b.bottom)
	if (right < left || bottom < top) {
		return null
	}

	return rect(left, top, right - left, bottom - top)
}

function screenRect(view: View): IntersectionRect | null {
	const origin = view.getLocationOnScreen?.()
	const size = view.getActualSize?.()
	if (!origin || !size) {
		return null
	}

	return rect(origin.x, origin.y, size.width, size.height)
}

/** Views that clip their children on both platforms. Plugin containers
 *  (CollectionView &co.) are not enumerable here — pass the scroller as
 *  `root` so its bounds bound the intersection instead. */
function clipsChildren(view: View): boolean {
	return view instanceof ScrollView || view instanceof ListView
}

/** CSS margin shorthand → fixed dips + fractions of the root dimension. */
function parseRootMargin(raw: string): { dips: Margin; percent: Margin } {
	const zero = () => ({ top: 0, right: 0, bottom: 0, left: 0 })
	const dips = zero()
	const percent = zero()
	const tokens = raw.trim().split(/\s+/).filter(Boolean)
	if (tokens.length > 4) {
		throw new SyntaxError(`rootMargin must be 1–4 values, got "${raw}"`)
	}

	const keys = ['top', 'right', 'bottom', 'left'] as const
	tokens.forEach((token, index) => {
		const match = /^(-?\d+(?:\.\d+)?)(px|%)$/.exec(token)
		if (!match) {
			throw new SyntaxError(`rootMargin values need a px or % unit, got "${token}"`)
		}

		const value = Number(match[1])
		// CSS shorthand expansion: vertical/horizontal pairs repeat.
		const key = index === 0 ? 'top' : index === 1 ? 'right' : index === 2 ? 'bottom' : 'left'
		if (match[2] === 'px') {
			dips[key] = value
		} else {
			percent[key] = value / 100
		}
	})

	if (tokens.length === 1) {
		for (const key of keys) {
			dips[key] = dips.top
			percent[key] = percent.top
		}
	} else if (tokens.length === 2) {
		dips.bottom = dips.top
		percent.bottom = percent.top
		dips.left = dips.right
		percent.left = percent.right
	} else if (tokens.length === 3) {
		dips.left = dips.right
		percent.left = percent.right
	}

	return { dips, percent }
}

function normalizeThresholds(raw: number | number[] | undefined): number[] {
	const list = raw == null ? [0] : Array.isArray(raw) ? raw : [raw]
	if (list.length === 0) {
		return [0]
	}

	const sorted = [...new Set(list)].sort((a, b) => a - b)
	for (const t of sorted) {
		if (typeof t !== 'number' || Number.isNaN(t) || t < 0 || t > 1) {
			throw new RangeError(`threshold values must be numbers between 0 and 1, got ${t}`)
		}
	}

	return sorted
}

interface Tracked {
	/** False until the target has loaded and produced a nonzero measure —
	 *  before that, geometry reads are transient garbage. */
	armed: boolean
	last: number | null
	detach: () => void
}

/** Tracks NativeScript view visibility against a root or the screen. */
export class IntersectionObserver implements IntersectionObserverShape {
	readonly root: View | null
	readonly rootMargin: string
	readonly thresholds: readonly number[]

	private readonly callback: IntersectionObserverCallback
	private readonly marginDips: Margin
	private readonly marginPercent: Margin
	private readonly targets = new Map<View, Tracked>()
	private queue: IntersectionObserverEntry[] = []
	// Notifications are batched onto a timer like the DOM observer — never
	// invoked inside a scroll/layoutChanged dispatch, where a callback that
	// mutates layout could reenter evaluation.
	private flushScheduled = false
	private evaluating = false
	private pendingEval = new Set<View>()

	/** Creates an observer that reports threshold crossings for its targets. */
	constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
		this.callback = callback
		this.root = options.root instanceof View ? options.root : null
		this.rootMargin = options.rootMargin ?? '0px'
		const { dips, percent } = parseRootMargin(this.rootMargin)
		this.marginDips = dips
		this.marginPercent = percent
		this.thresholds = normalizeThresholds(options.threshold)
	}

	/** Starts observing a NativeScript view. */
	observe(target: unknown): void {
		if (!(target instanceof View) || this.targets.has(target)) {
			return
		}

		// First evaluation waits for the target's first real layout — a
		// just-loaded view can still report transient mid-layout geometry.
		const reevaluate = () => {
			const targetRect = screenRect(target)
			if (
				!tracked.armed &&
				target.isLoaded &&
				targetRect != null &&
				targetRect.width > 0 &&
				targetRect.height > 0
			) {
				tracked.armed = true
			}
			if (tracked.armed) {
				this.evaluate(target)
			}
		}
		const seen = new Set<View>()
		const listeners: Array<[View, string]> = []
		const on = (view: View, event: string) => {
			if (seen.has(view)) {
				return
			}

			seen.add(view)
			listeners.push([view, event])
			view.on(event, reevaluate)
		}

		on(target, 'loaded')
		on(target, 'layoutChanged')
		on(target, 'unloaded')
		let ancestor = target.parent as View | undefined
		for (let depth = 0; ancestor && depth < 64; depth++) {
			on(ancestor, 'scroll')
			on(ancestor, 'layoutChanged')
			const next = ancestor.parent as View | undefined
			ancestor = next === ancestor ? undefined : next
		}

		if (this.root) {
			on(this.root, 'scroll')
			on(this.root, 'layoutChanged')
		}

		const tracked: Tracked = {
			armed: false,
			last: null,
			detach: () => {
				for (const [view, event] of listeners) {
					view.off(event, reevaluate)
				}
			},
		}
		this.targets.set(target, tracked)

		// Hook effects can run before NativeScript completes the first layout.
		// Defer the first geometry read so it cannot capture the host's temporary
		// screen-sized frame for the target.
		setTimeout(reevaluate, 16)
	}

	/** Stops observing one view. */
	unobserve(target: unknown): void {
		const tracked = this.targets.get(target as View)
		if (!tracked) {
			return
		}

		tracked.detach()
		this.targets.delete(target as View)
	}

	/** Stops observing every view and removes native event listeners. */
	disconnect(): void {
		for (const tracked of this.targets.values()) {
			tracked.detach()
		}

		this.targets.clear()
	}

	/** Returns and clears entries that have not yet been delivered. */
	takeRecords(): IntersectionObserverEntry[] {
		return this.queue.splice(0)
	}

	/** Root bounds in screen space, expanded by rootMargin. */
	private rootBounds(): IntersectionRect {
		const base = this.root
			? (screenRect(this.root) ?? rect(0, 0, 0, 0))
			: rect(0, 0, Screen.mainScreen.widthDIPs, Screen.mainScreen.heightDIPs)

		// IntersectionObserver resolves every rootMargin percentage against
		// the undilated root width, including top and bottom margins.
		const top = this.marginDips.top + this.marginPercent.top * base.width
		const right = this.marginDips.right + this.marginPercent.right * base.width
		const bottom = this.marginDips.bottom + this.marginPercent.bottom * base.width
		const left = this.marginDips.left + this.marginPercent.left * base.width
		return rect(base.x - left, base.y - top, base.width + left + right, base.height + top + bottom)
	}

	private measure(target: View): IntersectionObserverEntry | null {
		const targetRect = screenRect(target)
		if (!targetRect || !target.isLoaded) {
			return null
		}

		// Clip by every ancestor that clips its children, walking up to the
		// root (or the top when root lives outside the ancestor chain — the
		// screen-space math is hierarchy-independent).
		let clip: IntersectionRect | null = targetRect
		let ancestor = target.parent as View | undefined
		for (let depth = 0; ancestor && ancestor !== this.root && depth < 64; depth++) {
			if (clipsChildren(ancestor)) {
				const ancestorRect = ancestor.isLoaded ? screenRect(ancestor) : null
				if (!ancestorRect) {
					return null
				}

				clip = intersect(clip, ancestorRect)
				if (!clip) {
					break
				}
			}

			const next = ancestor.parent as View | undefined
			ancestor = next === ancestor ? undefined : next
		}

		const rootBounds = this.rootBounds()
		const intersection = clip && intersect(clip, rootBounds)
		const isIntersecting = intersection != null
		const targetArea = targetRect.width * targetRect.height
		const intersectionRatio = isIntersecting
			? targetArea > 0
				? (intersection.width * intersection.height) / targetArea
				: 1
			: 0

		return {
			target,
			time: Date.now(),
			isIntersecting,
			intersectionRatio,
			boundingClientRect: targetRect,
			rootBounds,
			intersectionRect: intersection ?? rect(0, 0, 0, 0),
		}
	}

	private evaluate(target: View): void {
		if (this.evaluating) {
			// A listener fired reentrantly from inside measure() — coalesce.
			this.pendingEval.add(target)
			return
		}

		this.evaluating = true
		try {
			this.evaluateNow(target)
			while (this.pendingEval.size) {
				const queued = [...this.pendingEval]
				this.pendingEval.clear()
				for (const pending of queued) {
					this.evaluateNow(pending)
				}
			}
		} finally {
			this.evaluating = false
		}
	}

	private evaluateNow(target: View): void {
		const tracked = this.targets.get(target)
		if (!tracked) {
			return
		}

		const entry = this.measure(target)
		if (!entry) {
			// No geometry while still loaded is a transient mid-layout read —
			// keep the last state. Only a real unload reports the exit.
			if (tracked.last && !target.isLoaded) {
				tracked.last = 0
				this.queue.push(this.emptyEntry(target))
				this.schedule()
			}

			return
		}

		const index = entry.isIntersecting
			? Math.max(1, this.thresholds.reduce((n, t) => n + (entry.intersectionRatio >= t ? 1 : 0), 0))
			: 0

		if (index !== tracked.last) {
			tracked.last = index
			this.queue.push(entry)
			this.schedule()
		}
	}

	private emptyEntry(target: View): IntersectionObserverEntry {
		return {
			target,
			time: Date.now(),
			isIntersecting: false,
			intersectionRatio: 0,
			boundingClientRect: rect(0, 0, 0, 0),
			rootBounds: this.rootBounds(),
			intersectionRect: rect(0, 0, 0, 0),
		}
	}

	private schedule(): void {
		if (this.flushScheduled) {
			return
		}

		this.flushScheduled = true
		setTimeout(() => {
			this.flushScheduled = false
			const entries = this.queue.splice(0)
			if (entries.length) {
				this.callback(entries, this)
			}
		}, 0)
	}
}
