import {
	VIRTUAL_LIST_BENCH_INTERVAL_MS,
	runVirtualListBenchTrace,
	runVirtualListInputTrace,
	type VirtualListBenchSnapshot,
} from '../virtual-list-benchmark'

// The AppKit host's renderer publishes __xplatMacOSDebug only under
// OCTANE_MACOS_AUTOMATION=1 — every bench-* script already sets it, so the
// probe doubles as the reachability check.
function probe() {
	const debug = (globalThis as any).__xplatMacOSDebug
	if (typeof debug?.listSnapshot !== 'function') {
		throw new Error(
			'VirtualList profiling on the AppKit host requires OCTANE_MACOS_AUTOMATION=1',
		)
	}

	return debug
}

export async function runVirtualListBenchmark(listId: string) {
	const debug = probe()
	return runVirtualListBenchTrace({
		target: 'macos',
		read: (): VirtualListBenchSnapshot => debug.listSnapshot(listId),
		writeOffset: (offset) => debug.scrollToTop(listId, offset),
		wait: () => new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
	})
}

export async function runVirtualListInputBenchmark(listId: string, durationMs = 20_000) {
	const debug = probe()
	return runVirtualListInputTrace(
		{
			target: 'macos',
			read: (): VirtualListBenchSnapshot => debug.listSnapshot(listId),
			wait: () => new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
		},
		durationMs,
	)
}
