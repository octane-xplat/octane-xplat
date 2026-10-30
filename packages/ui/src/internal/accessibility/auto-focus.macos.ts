import type { NSView } from '@octane-xplat/platform/macos'

type Host = Record<string, any>
const read = (view: object, name: string) => {
	const value = Reflect.get(view, name)
	return typeof value === 'function' ? value.call(view) : value
}

const enabled = (view: object, name: string) => {
	const value = read(view, name)
	return value == null || Boolean(value)
}

/** Private one-shot autofocus request. Native observation exists only while a
 * request waits for its first attached, visible host; input always passes on. */
export function createAppKitAutoFocus(
	options: { requested(): boolean; blocked(): boolean },
	native: () => Host = () => globalThis,
) {
	type Request = {
		view: NSView | null
		window: any
		responder: unknown
		queued: boolean
		observed: boolean
	}
	let view: NSView | null = null,
		requested = false,
		disposed = false,
		pending: Request | null = null
	const releases: (() => void)[] = []
	const cancel = () => {
		pending = null // Retire before native cleanup or application focus callbacks.
		for (const release of releases.splice(0)) {
			try {
				release()
			} catch (error) {
				console.warn('[macos-autofocus] cleanup failed', error)
			}
		}
	}
	const attempt = (request: Request): void => {
		if (pending !== request || disposed) {
			return
		}
		if (!options.requested() || options.blocked() || request.view !== view) {
			cancel()
			return
		}
		const target = view,
			window = target?.window
		if (!target || !window) {
			if (request.window || !request.observed) {
				cancel()
			}

			return
		}
		if (request.window && request.window !== window) {
			cancel()
			return
		}
		// Snapshot late attachment before another microtask claims the responder,
		// so competing requests from the same commit see each other's focus move.
		if (!request.window) {
			request.window = window
			request.responder = window.firstResponder
			queue(request)
			return
		}
		const responder = window.firstResponder
		if (
			responder === target ||
			(responder != null && responder === read(target, 'currentEditor'))
		) {
			cancel()
			return
		}
		if (
			responder !== request.responder ||
			!['enabled', 'isEnabled', 'isAccessibilityEnabled'].every((key) => enabled(target, key))
		) {
			cancel()
			return
		}
		if (read(target, 'hidden') || read(target, 'hiddenOrHasHiddenAncestor')) {
			if (!request.observed) {
				cancel()
			}

			return
		}
		if (read(target, 'acceptsFirstResponder') === false) {
			cancel()
			return
		}
		cancel() // One attempt, including native refusal; never activate a window.
		if (
			disposed ||
			view !== target ||
			target.window !== window ||
			!options.requested() ||
			options.blocked()
		) {
			return
		}
		try {
			window.makeFirstResponder(target)
		} catch (error) {
			console.warn('[macos-autofocus] focus request failed', error)
		}
	}
	const queue = (request: Request): void => {
		const window = view?.window
		if (!request.window && request.view === view && window) {
			request.window = window
			request.responder = window.firstResponder
		}
		if (request.queued) {
			return
		}
		request.queued = true
		void Promise.resolve().then(() => {
			request.queued = false
			try {
				attempt(request)
			} catch (error) {
				if (pending === request) {
					cancel()
				}

				console.warn('[macos-autofocus] attachment check failed', error)
			}
		})
	}
	const observe = (request: Request) => {
		const host = native(),
			center = host.NSNotificationCenter?.defaultCenter,
			events = host.NSEvent
		// An unobservable request gets one post-commit attempt, never a delayed
		// retry that could steal focus after unobserved user activity.
		if (
			!center?.addObserverForNameObjectQueueUsingBlock ||
			!center?.removeObserver ||
			!events?.addLocalMonitorForEventsMatchingMaskHandler ||
			!events?.removeMonitor
		) {
			return
		}
		try {
			const mask =
				(host.NSEventMask?.KeyDown ?? 1024) |
				(host.NSEventMask?.LeftMouseDown ?? 2) |
				(host.NSEventMask?.RightMouseDown ?? 8) |
				(host.NSEventMask?.OtherMouseDown ?? 33554432)

			const monitor = events.addLocalMonitorForEventsMatchingMaskHandler(mask, (event: unknown) => {
				if (pending === request) {
					cancel()
				}
				return event
			})

			if (monitor == null) {
				throw Error('AppKit input observation unavailable')
			}

			releases.push(() => events.removeMonitor(monitor))
			for (const name of [
				'NSWindowDidUpdateNotification',
				'NSApplicationDidResignActiveNotification',
			]) {
				const token = center.addObserverForNameObjectQueueUsingBlock(
					host[name] ?? name,
					null,
					null,
					(note: { object: unknown }) => {
						if (pending !== request) {
							return
						}
						if (name === 'NSApplicationDidResignActiveNotification') {
							cancel()
						} else if (note.object === view?.window || note.object === request.window) {
							queue(request)
						}
					},
				)

				if (token == null) {
					throw Error('AppKit window observation unavailable')
				}

				releases.push(() => center.removeObserver(token))
			}

			if (pending !== request) {
				throw Error('AppKit focus request retired during observation')
			}

			request.observed = true
		} catch (error) {
			for (const release of releases.splice(0)) {
				try {
					release()
				} catch (cleanupError) {
					console.warn('[macos-autofocus] cleanup failed', cleanupError)
				}
			}

			console.warn('[macos-autofocus] delayed observation unavailable', error)
		}
	}
	const update = () => {
		if (disposed) {
			return
		}
		const next = options.requested(),
			rising = next && !requested
		requested = next
		if (!next || options.blocked()) {
			cancel()
			return
		}
		if (rising) {
			cancel()
			const window = view?.window
			pending = { view, window, responder: window?.firstResponder, queued: false, observed: false }
			observe(pending)
		}
		if (pending) {
			queue(pending)
		}
	}
	return {
		update,
		bind(next: NSView | null) {
			if (disposed || view === next) {
				return
			}
			if (view || !next) {
				cancel()
			} else if (pending && !pending.view) {
				pending.view = next
			}
			view = next
			update()
		},
		dispose() {
			disposed = true
			cancel()
			view = null
		},
	}
}
