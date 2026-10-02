import {
	VIRTUAL_LIST_BENCH_INTERVAL_MS,
	runVirtualListInputTrace,
	runVirtualListBenchTrace,
	type VirtualListBenchAdapter,
	type VirtualListBenchSnapshot,
} from '../virtual-list-benchmark'

function readSnapshot(list: HTMLElement | null): VirtualListBenchSnapshot {
	if (!list) {
		return { offset: 0, viewportHeight: 0, rows: [], mountedIndices: [] }
	}
	const listRect = list.getBoundingClientRect()
	const rowNodes = Array.from(list.querySelectorAll<HTMLElement>('[id^="vlist-bench-row-"]'))
	const rows = rowNodes.flatMap((node) => {
		const match = /^vlist-bench-row-(\d+)$/.exec(node.id)
		if (!match) {
			return []
		}
		const rect = node.getBoundingClientRect()
		return [
			{ index: Number(match[1]), top: rect.top - listRect.top, bottom: rect.bottom - listRect.top },
		]
	})

	return {
		offset: list.scrollTop,
		viewportHeight: list.clientHeight,
		rows,
		mountedIndices: rows.map((row) => row.index),
	}
}

export async function runVirtualListBenchmark(listId: string, root?: ParentNode) {
	const list = (root?.querySelector?.(`#${listId}`) ??
		document.getElementById(listId)) as HTMLElement | null
	const adapter: VirtualListBenchAdapter = {
		target: 'web',
		read: () => readSnapshot(list),
		writeOffset: (offset) => {
			if (list) {
				list.scrollTop = offset
			}
		},
		wait: () => new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
	}

	return runVirtualListBenchTrace(adapter)
}

export async function runVirtualListInputBenchmark(
	listId: string,
	durationMs = 20_000,
	root?: ParentNode,
) {
	const list = (root?.querySelector?.(`#${listId}`) ??
		document.getElementById(listId)) as HTMLElement | null
	return runVirtualListInputTrace(
		{
			target: 'web',
			read: () => readSnapshot(list),
			wait: () =>
				new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
		},
		durationMs,
	)
}
