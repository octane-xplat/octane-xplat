import { Application } from '@nativescript/core'
import { findInRootLayouts } from '@octane-xplat/ui/native'
import {
	VIRTUAL_LIST_BENCH_INTERVAL_MS,
	runVirtualListBenchTrace,
	type VirtualListBenchAdapter,
	type VirtualListBenchSnapshot,
} from '../virtual-list-benchmark'

function collect(view: any, out: any[] = []): any[] {
	if (!view) return out
	out.push(view)
	view.eachChildView?.((child: any) => {
		collect(child, out)
		return true
	})
	return out
}

function readSnapshot(list: any): VirtualListBenchSnapshot {
	if (!list) return { offset: 0, viewportHeight: 0, rows: [], mountedIndices: [] }
	const listY = Number(list.getLocationOnScreen?.()?.y ?? 0)
	const viewportHeight = Number(list.getActualSize?.()?.height ?? 0)
	const rows = collect(list).flatMap((view) => {
		const match = /^vlist-bench-row-(\d+)$/.exec(String(view.id ?? ''))
		if (!match) return []
		const top = Number(view.getLocationOnScreen?.()?.y ?? Number.NaN) - listY
		const height = Number(view.getActualSize?.()?.height ?? 0)
		if (!Number.isFinite(top) || height <= 0) return []
		return [{ index: Number(match[1]), top, bottom: top + height }]
	})
	return {
		offset: Number(list.verticalOffset ?? 0),
		viewportHeight,
		rows,
		mountedIndices: rows.map((row) => row.index),
	}
}

export async function runVirtualListBenchmark(listId: string, root?: any) {
	const appRoot: any = Application.getRootView?.()
	const list: any =
		root?.getViewById?.(listId) ?? findInRootLayouts(listId) ?? appRoot?.getViewById?.(listId)
	const adapter: VirtualListBenchAdapter = {
		target: Application.android != null ? 'android' : 'ios',
		read: () => readSnapshot(list),
		writeOffset: (offset) => {
			const nativeView = list?.nativeViewProtected
			const makePoint = (globalThis as any).CGPointMake
			if (
				typeof nativeView?.setContentOffsetAnimated === 'function' &&
				typeof makePoint === 'function'
			) {
				const current = nativeView.contentOffset
				nativeView.setContentOffsetAnimated(makePoint(current.x, offset), false)
			} else {
				list?.scrollToVerticalOffset?.(offset, false)
			}
		},
		wait: () => new Promise<void>((resolve) => setTimeout(resolve, VIRTUAL_LIST_BENCH_INTERVAL_MS)),
	}
	return runVirtualListBenchTrace(adapter)
}
