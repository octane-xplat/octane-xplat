import type { UseFocusVisibleResult } from './use-focus-visible.tsrx'

/** @internal AppKit modality tracker. Hook readers share one native monitor;
 * a non-hook global read retains it until explicit disposal/module teardown. */
export function createAppKitFocusVisibleSource(
	native: () => Record<string, any> = () => globalThis,
	observeKeys?: (notify: (event: { type: number; modifierFlags: number }) => void) => () => void,
	observePointer?: (
		notify: (event: { type: number; modifierFlags: number }) => void,
	) => (() => void) | undefined,
): {
	getSnapshot: () => UseFocusVisibleResult
	subscribe(notify: () => void): () => void
	isFocusVisible(): boolean
	dispose(): void
} {
	let state: UseFocusVisibleResult = {
		isFocusVisible: false,
		inputModality: 'unknown',
		isSupported: false,
	}
	const listeners = new Set<() => void>()
	let release: (() => void) | undefined
	let pinned = false
	let failed = false
	const capable = () => {
		const host = native()
		const center = host.NSNotificationCenter?.defaultCenter
		return Boolean(
			host.NSEvent?.addLocalMonitorForEventsMatchingMaskHandler &&
			host.NSEvent?.removeMonitor &&
			center?.addObserverForNameObjectQueueUsingBlock &&
			center?.removeObserver,
		)
	}
	const publish = (
		inputModality: UseFocusVisibleResult['inputModality'],
		supported = !failed && capable(),
	) => {
		const isFocusVisible = inputModality === 'keyboard'
		if (state.inputModality === inputModality && state.isSupported === supported) {
			return
		}
		state = { isFocusVisible, inputModality, isSupported: supported }
		for (const notify of [...listeners]) {
			notify()
		}
	}
	const getSnapshot = (): UseFocusVisibleResult => {
		const supported = !failed && capable()
		if (state.isSupported !== supported) {
			state = { ...state, isSupported: supported }
		}
		return state
	}
	const attach = () => {
		if (release || !capable()) {
			return
		}
		const host = native()
		const events = host.NSEvent
		const center = host.NSNotificationCenter.defaultCenter
		let monitor: unknown
		let observer: unknown
		let releaseKeys: (() => void) | undefined
		let releasePointer: (() => void) | undefined
		const cleanup = () => {
			try {
				if (monitor != null) {
					events.removeMonitor(monitor)
				}
			} finally {
				try {
					if (observer != null) {
						center.removeObserver(observer)
					}
				} finally {
					try {
						releaseKeys?.()
					} finally {
						releasePointer?.()
					}
				}
			}
		}
		try {
			const keyObserved = (event: { type: number; modifierFlags: number }) => {
				if (
					Number(event.type) === 10 &&
					!(Number(event.modifierFlags) & ((1 << 18) | (1 << 19) | (1 << 20)))
				) {
					publish('keyboard')
				}
			}

			const pointerObserved = (event: { type: number }) => {
				if ([1, 3, 25].includes(event.type)) {
					publish('pointer')
				}
			}

			releaseKeys = observeKeys?.(keyObserved)
			releasePointer = observePointer?.(pointerObserved)
			const mask =
				(host.NSEventMask?.KeyDown ?? 1024) |
				(releasePointer
					? 0
					: (host.NSEventMask?.LeftMouseDown ?? 2) |
						(host.NSEventMask?.RightMouseDown ?? 8) |
						(host.NSEventMask?.OtherMouseDown ?? 33554432))

			monitor = events.addLocalMonitorForEventsMatchingMaskHandler(mask, (event: any) => {
				if (Number(event.type) === 10) {
					// Modified application shortcuts do not switch to keyboard modality.
					keyObserved(event)
				} else if (!releasePointer && [1, 3, 25].includes(Number(event.type))) {
					publish('pointer')
				}
				return event // Observation never consumes a native event.
			})

			observer = center.addObserverForNameObjectQueueUsingBlock(
				host.NSApplicationDidResignActiveNotification ?? 'NSApplicationDidResignActiveNotification',
				null,
				null,
				() => publish('unknown'),
			)

			if (monitor == null || observer == null) {
				throw new Error('AppKit input observation unavailable')
			}

			release = cleanup
			failed = false
			publish(state.inputModality, true)
		} catch {
			try {
				cleanup()
			} finally {
				failed = true
				publish('unknown', false)
			}
		}
	}
	return {
		getSnapshot,
		subscribe(notify: () => void): () => void {
			listeners.add(notify)
			attach()
			return () => {
				listeners.delete(notify)
				if (!listeners.size && !pinned) {
					const cleanup = release
					release = undefined
					try {
						cleanup?.()
					} finally {
						publish('unknown')
					}
				}
			}
		},
		isFocusVisible(): boolean {
			pinned = true
			attach()
			return getSnapshot().isFocusVisible
		},
		dispose(): void {
			pinned = false
			const cleanup = release
			release = undefined
			try {
				cleanup?.()
			} finally {
				publish('unknown')
			}
		},
	}
}
