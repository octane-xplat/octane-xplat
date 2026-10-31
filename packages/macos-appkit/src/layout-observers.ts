/** A completed renderer layout batch. The host can force pending AppKit layout before measuring. */
export interface LayoutCommit {
	hostView: any
}

const observers = new Set<(commit: LayoutCommit) => void>()

/** Observe layout-changing renderer batches across roots. Returns an unsubscribe function. */
export function observeLayoutCommits(observer: (commit: LayoutCommit) => void): () => void {
	observers.add(observer)
	return () => {
		observers.delete(observer)
	}
}

export function notifyLayoutCommit(hostView: any): void {
	// Snapshot membership: subscriptions added during dispatch start next time.
	const current = Array.from(observers)
	for (const observer of current) {
		observer({ hostView })
	}
}
