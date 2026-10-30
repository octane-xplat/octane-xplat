/** Native callbacks capture membership once; removed leases never deliver. */
export function notifyAppKitListeners<T>(listeners: ReadonlySet<T>, invoke: (listener: T) => void): void {
	for (const listener of [...listeners]) {
		if (!listeners.has(listener)) {continue}
		try { invoke(listener) } catch {
			// A consumer cannot abort native dispatch to unrelated owners.
			// Do not log application data or errors from this boundary.
		}
	}
}

/** Even identical callbacks receive independent, idempotent registrations. */
export function subscribeAppKitEvent<Args extends unknown[]>(
	listeners: Set<(...args: Args) => void>, listener: (...args: Args) => void,
): { dispatch: (...args: Args) => void; dispose: () => void } {
	let active = true
	const dispatch = (...args: Args) => { if (active) {listener(...args)} }
	listeners.add(dispatch)
	return {
		dispatch,
		dispose() {
			if (!active) {return}
			active = false
			listeners.delete(dispatch)
		},
	}
}
