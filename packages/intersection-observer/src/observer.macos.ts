// IntersectionObserver — AppKit implementation.
// Geometry is measured in top-left window-content coordinates. NSClipView
// bounds notifications cover scrolling; frame notifications cover layout.
import type {
	IntersectionObserverCallback,
	IntersectionObserverEntry,
	IntersectionObserverInit,
	IntersectionObserverShape,
	IntersectionRect,
} from './types'

const appKit = globalThis as any
const frameChanged = appKit.NSViewFrameDidChangeNotification ?? 'NSViewFrameDidChangeNotification'
const boundsChanged =
	appKit.NSViewBoundsDidChangeNotification ?? 'NSViewBoundsDidChangeNotification'

/** Whether geometry-backed observation is available on the AppKit host. */
export const supported = true

interface Margin {
	top: number
	right: number
	bottom: number
	left: number
}

interface Tracked {
	last: number | null
	observers: any[]
	detach: () => void
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

function isView(view: unknown): view is any {
	const candidate = view as any
	return !!candidate?.bounds && typeof candidate.convertRectToView === 'function'
}

function isClipView(view: any): boolean {
	const ClipView = appKit.NSClipView
	return !!ClipView && Boolean(view?.isKindOfClass?.(ClipView))
}

function viewportView(view: any): any {
	if (isClipView(view)) {
		return view
	}

	if (isView(view?.contentView) && isClipView(view.contentView)) {
		return view.contentView
	}

	return view
}

function windowRect(view: any): IntersectionRect | null {
	const appKitWindow = view?.window
	const contentView = appKitWindow?.contentView
	if (!isView(view) || !isView(contentView)) {
		return null
	}

	try {
		const converted = view.convertRectToView(view.bounds, contentView)
		const { origin, size } = converted
		const contentBounds = contentView.bounds
		const boundsOriginY = Number(contentBounds.origin.y)
		const height = Number(size.height)
		const contentHeight = Number(contentBounds.size.height)
		const flippedValue =
			typeof contentView.isFlipped === 'function' ? contentView.isFlipped() : contentView.isFlipped

		const flipped = flippedValue === true || Number(flippedValue) === 1
		const y = flipped
			? Number(origin.y) - boundsOriginY
			: boundsOriginY + contentHeight - Number(origin.y) - height

		return rect(Number(origin.x) - Number(contentBounds.origin.x), y, Number(size.width), height)
	} catch {
		return null
	}
}

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

		const key = index === 0 ? 'top' : index === 1 ? 'right' : index === 2 ? 'bottom' : 'left'
		const value = Number(match[1])
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
	for (const threshold of sorted) {
		if (
			typeof threshold !== 'number' ||
			Number.isNaN(threshold) ||
			threshold < 0 ||
			threshold > 1
		) {
			throw new RangeError(`threshold values must be numbers between 0 and 1, got ${threshold}`)
		}
	}

	return sorted
}

/** Tracks visibility in an AppKit window and its enclosing NSClipViews. */
export class IntersectionObserver implements IntersectionObserverShape {
	readonly root: any | null
	readonly rootMargin: string
	readonly thresholds: readonly number[]

	private readonly callback: IntersectionObserverCallback
	private readonly marginDips: Margin
	private readonly marginPercent: Margin
	private readonly targets = new Map<any, Tracked>()
	private queue: IntersectionObserverEntry[] = []
	private flushTimer: ReturnType<typeof setTimeout> | null = null

	constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
		this.callback = callback
		this.root = options.root ?? null
		this.rootMargin = options.rootMargin ?? '0px'
		const { dips, percent } = parseRootMargin(this.rootMargin)
		this.marginDips = dips
		this.marginPercent = percent
		this.thresholds = normalizeThresholds(options.threshold)
	}

	/** Starts observing an AppKit NSView. */
	observe(target: unknown): void {
		if (!isView(target) || this.targets.has(target)) {
			return
		}

		const tracked: Tracked = {
			last: null,
			observers: [],
			detach: () => {
				for (const observer of tracked.observers) {
					appKit.NSNotificationCenter.defaultCenter.removeObserver(observer)
				}

				tracked.observers = []
			},
		}

		this.targets.set(target, tracked)

		const listen = (view: any, name: string, rebind = false) => {
			tracked.observers.push(
				appKit.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
					name,
					view,
					null,
					() => {
						if (!this.targets.has(target)) {
							return
						}

						if (rebind) {
							bindHierarchy()
						}

						this.evaluate(target)
					},
				),
			)
		}

		const bindHierarchy = () => {
			tracked.detach()
			const seen = new Set<any>()
			const observeView = (view: any, isTarget = false) => {
				if (!isView(view) || seen.has(view)) {
					return
				}

				seen.add(view)
				view.postsFrameChangedNotifications = true
				listen(view, frameChanged, isTarget)
				if (isClipView(view)) {
					view.postsBoundsChangedNotifications = true
					listen(view, boundsChanged)
				}
			}

			observeView(target, true)
			let ancestor = target.superview
			for (let depth = 0; ancestor && depth < 64; depth++) {
				observeView(ancestor)
				if (ancestor === this.root) {
					break
				}

				const next = ancestor.superview
				ancestor = next === ancestor ? null : next
			}

			observeView(viewportView(this.root))
		}

		bindHierarchy()
		setTimeout(() => this.evaluate(target), 16)
	}

	unobserve(target: unknown): void {
		const tracked = this.targets.get(target)
		if (!tracked) {
			return
		}

		tracked.detach()
		this.targets.delete(target)
		this.queue = this.queue.filter((entry) => entry.target !== target)
		this.cancelFlushIfEmpty()
	}

	disconnect(): void {
		for (const tracked of this.targets.values()) {
			tracked.detach()
		}

		this.targets.clear()
		this.queue = []
		this.cancelFlushIfEmpty()
	}

	takeRecords(): IntersectionObserverEntry[] {
		const entries = this.queue.splice(0)
		this.cancelFlushIfEmpty()
		return entries
	}

	private rootBounds(target: any): IntersectionRect | null {
		const root = this.root ? viewportView(this.root) : target.window?.contentView
		const base = windowRect(root)
		if (!base) {
			return null
		}

		const top = this.marginDips.top + this.marginPercent.top * base.width
		const right = this.marginDips.right + this.marginPercent.right * base.width
		const bottom = this.marginDips.bottom + this.marginPercent.bottom * base.width
		const left = this.marginDips.left + this.marginPercent.left * base.width
		return rect(base.x - left, base.y - top, base.width + left + right, base.height + top + bottom)
	}

	private measure(target: any): IntersectionObserverEntry | null {
		const targetRect = windowRect(target)
		if (!targetRect) {
			return null
		}

		let clipped: IntersectionRect | null = targetRect
		let ancestor = target.superview
		for (let depth = 0; ancestor && ancestor !== this.root && depth < 64; depth++) {
			if (isClipView(ancestor)) {
				const clipRect = windowRect(ancestor)
				if (!clipRect) {
					return null
				}

				clipped = intersect(clipped, clipRect)
				if (!clipped) {
					break
				}
			}

			const next = ancestor.superview
			ancestor = next === ancestor ? null : next
		}

		const rootBounds = this.rootBounds(target)
		if (!rootBounds) {
			return null
		}

		const intersection = clipped && intersect(clipped, rootBounds)
		const targetArea = targetRect.width * targetRect.height
		return {
			target,
			time: Date.now(),
			isIntersecting: intersection != null,
			intersectionRatio: intersection
				? targetArea > 0
					? (intersection.width * intersection.height) / targetArea
					: 1
				: 0,
			boundingClientRect: targetRect,
			rootBounds,
			intersectionRect: intersection ?? rect(0, 0, 0, 0),
		}
	}

	private evaluate(target: any): void {
		const tracked = this.targets.get(target)
		if (!tracked) {
			return
		}

		const entry = this.measure(target)
		if (!entry) {
			if (tracked.last != null && tracked.last > 0) {
				tracked.last = 0
				this.queue.push(this.emptyEntry(target))
				this.schedule()
			}

			return
		}

		const index = entry.isIntersecting
			? 1 +
				this.thresholds.reduce(
					(count, threshold) => count + (entry.intersectionRatio >= threshold ? 1 : 0),
					0,
				)
			: 0

		if (index !== tracked.last) {
			tracked.last = index
			this.queue.push(entry)
			this.schedule()
		}
	}

	private emptyEntry(target: any): IntersectionObserverEntry {
		return {
			target,
			time: Date.now(),
			isIntersecting: false,
			intersectionRatio: 0,
			boundingClientRect: rect(0, 0, 0, 0),
			rootBounds: this.rootBounds(target),
			intersectionRect: rect(0, 0, 0, 0),
		}
	}

	private schedule(): void {
		if (this.flushTimer != null) {
			return
		}

		this.flushTimer = setTimeout(() => {
			this.flushTimer = null
			const entries = this.queue.splice(0)
			if (entries.length) {
				this.callback(entries, this)
			}
		}, 0)
	}

	private cancelFlushIfEmpty(): void {
		if (!this.queue.length && this.flushTimer != null) {
			clearTimeout(this.flushTimer)
			this.flushTimer = null
		}
	}
}
