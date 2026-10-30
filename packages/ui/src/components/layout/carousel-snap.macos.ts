import type { NSScrollView, NSView, NSWindow } from '@octane-xplat/platform/macos'
export type AppKitCarouselSnap = {
	bind: (view: NSScrollView | null) => void
	invalidate: () => void
	validate: () => void
	dispose: () => void
}

export interface CarouselSnapClock {
	set(callback: () => void, delay: number): unknown
	clear(handle: unknown): void
}

const clock: CarouselSnapClock = {
	set: (callback, delay) => setTimeout(callback, delay),
	clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

const QUIET_MS = 140
function visible(view: NSView): boolean {
	return !['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => {
		const value = Reflect.get(view, name)
		return Boolean(typeof value === 'function' ? value.call(view) : value)
	})
}

/** Native user-scroll intent only; bounds changes from animations never schedule snap. */
export function createAppKitCarouselSnap(
	options: {
		view(): NSScrollView | null
		enabled(): boolean
		interaction(): void
		snap(): void
	},
	native: () => Record<string, any> = () => globalThis,
	timers: CarouselSnapClock = clock,
): AppKitCarouselSnap {
	let attached: NSScrollView | null = null,
		releases: (() => void)[] = [],
		timer: unknown = null,
		version = 0,
		bindingVersion = 0
	let tracking: { view: NSScrollView; window: NSWindow; active: boolean; dirty: boolean } | null =
		null
	const scope = () => {
		const view = options.view()
		return view && view === attached && view.window && visible(view)
			? { view, window: view.window }
			: null
	}
	const cancelTimer = () => {
		version++
		if (timer != null) {
			timers.clear(timer)
		}
		timer = null
	}
	const invalidate = (): void => {
		cancelTimer()
		if (tracking?.active) {
			tracking.dirty = false
		} else {
			tracking = null
		}
	}
	const validate = (): void => {
		const current = scope()
		if (
			!current ||
			(tracking && (tracking.view !== current.view || tracking.window !== current.window))
		) {
			invalidate()
			tracking = null
		} else if (!options.enabled()) {
			invalidate()
		}
	}
	const schedule = () => {
		cancelTimer()
		if (!tracking?.dirty || tracking.active || !options.enabled()) {
			return
		}
		const captured = tracking,
			request = version
		timer = timers.set(() => {
			if (request !== version) {
				return
			}
			timer = null
			const current = scope()
			if (
				!current ||
				tracking !== captured ||
				captured.active ||
				!captured.dirty ||
				!options.enabled() ||
				current.view !== captured.view ||
				current.window !== captured.window
			) {
				validate()
				return
			}
			tracking = null // Claim before native writes can synchronously dispatch more notifications.
			try {
				options.snap()
			} catch (error) {
				console.warn('[macos-carousel] snap request failed', error)
			}
		}, QUIET_MS)
	}
	const start = () => {
		const current = scope()
		if (!current) {
			validate()
			return
		}
		cancelTimer()
		tracking = { ...current, active: true, dirty: false }
		options.interaction()
	}
	const scrolled = () => {
		const current = scope()
		if (!current) {
			validate()
			return
		}
		if (!tracking || tracking.view !== current.view || tracking.window !== current.window) {
			tracking = { ...current, active: false, dirty: false }
		}
		tracking.dirty = options.enabled()
		options.interaction()
		if (!tracking.active) {
			schedule()
		}
	}
	const end = () => {
		validate()
		if (!tracking) {
			return
		}
		tracking.active = false
		if (tracking.dirty) {
			schedule()
		} else {
			tracking = null
		}
	}
	const bind = (view: NSScrollView | null): void => {
		if (view === attached && releases.length === 3) {
			return
		}
		const binding = ++bindingVersion
		attached = null
		invalidate()
		tracking = null
		for (const release of releases.splice(0)) {
			try {
				release()
			} catch (error) {
				console.warn('[macos-carousel] snap observation cleanup failed', error)
			}
		}
		attached = view
		if (!view) {
			return
		}
		const host = native(),
			center = host.NSNotificationCenter?.defaultCenter
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) {
			return
		}
		try {
			for (const [name, callback] of [
				['NSScrollViewWillStartLiveScrollNotification', start],
				['NSScrollViewDidLiveScrollNotification', scrolled],
				['NSScrollViewDidEndLiveScrollNotification', end],
			] as const) {
				const token = center.addObserverForNameObjectQueueUsingBlock(
					host[name] ?? name,
					view,
					null,
					(note: { object: NSScrollView }) => {
						if (
							bindingVersion === binding &&
							note.object === view &&
							attached === view &&
							options.view() === view
						) {
							callback()
						}
					},
				)

				if (token == null) {
					throw new Error('AppKit live-scroll observation unavailable')
				}

				releases.push(() => center.removeObserver(token))
			}
		} catch (error) {
			bind(null)
			console.warn('[macos-carousel] snap observation unavailable', error)
		}
	}
	return { bind, invalidate, validate, dispose: (): void => bind(null) }
}
