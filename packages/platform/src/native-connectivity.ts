import type { ConnectivityImpl, ConnectivityState } from './types'

type NativeConnectivityMonitor = {
	startMonitoring(callback: (value: number) => void): void
	stopMonitoring(): void
}

/** Share the core monitor while each facade supplies its target's state reader. */
export function createNativeConnectivity(
	monitor: NativeConnectivityMonitor,
	read: (value?: number) => ConnectivityState,
): ConnectivityImpl {
	const listeners = new Set<(state: ConnectivityState) => void>()
	let monitoring = false

	function notify(value: number) {
		if (listeners.size === 0) {
			return
		}

		const state = read(value)
		for (const listener of Array.from(listeners)) {
			if (listeners.has(listener)) {
				listener(state)
			}
		}
	}

	function startMonitoring() {
		if (monitoring) {
			return
		}

		monitoring = true
		try {
			monitor.startMonitoring(notify)
		} catch (error) {
			monitoring = false
			try {
				monitor.stopMonitoring()
			} catch {
				// Rollback must preserve the original startup failure.
			}

			throw error
		}
	}

	function stopMonitoring() {
		if (!monitoring) {
			return
		}

		monitoring = false
		monitor.stopMonitoring()
	}

	return {
		getState: read,
		subscribe(listener) {
			// A repeated callback still owns a distinct subscription and teardown.
			const callback = (state: ConnectivityState) => listener(state)
			listeners.add(callback)
			try {
				const snapshot = read()
				callback(snapshot)
				if (snapshot.supported !== false) {
					startMonitoring()
				}
			} catch (error) {
				listeners.delete(callback)
				if (listeners.size === 0) {
					try {
						stopMonitoring()
					} catch {}
				}

				throw error
			}
			return () => {
				if (!listeners.delete(callback)) {
					return
				}
				if (listeners.size === 0) {
					stopMonitoring()
				}
			}
		},
	}
}
