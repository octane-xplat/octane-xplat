import type { ListViewabilityConfig } from './props'
import type { VisibleListRow } from './list-viewability-core'

@NativeClass
class ContentOffsetObserver extends NSObject {
	callback: (() => void) | null = null

	observeValueForKeyPathOfObjectChangeContext(_path: string, _object: UIScrollView) {
		this.callback?.()
	}
}

export function observeListViewability(
	list: any,
	getState: () => {
		items: readonly any[]
		config?: ListViewabilityConfig
		update: (
			rows: readonly VisibleListRow[],
			items: readonly any[],
			config?: ListViewabilityConfig,
		) => void
	},
) {
	const table = list?.ios as UITableView | undefined
	if (!table) {
		return { refresh() {}, dispose() {} }
	}

	const observer = ContentOffsetObserver.alloc().init() as ContentOffsetObserver
	let scheduled = false
	let disposed = false
	let timer: ReturnType<typeof setTimeout> | null = null
	const refresh = () => {
		if (scheduled || disposed) {
			return
		}

		scheduled = true
		timer = setTimeout(() => {
			timer = null
			scheduled = false
			if (disposed) {
				return
			}

			const state = getState()
			const offset = Number(table.contentOffset?.y ?? 0)
			const insets = table.adjustedContentInset ?? table.contentInset
			const top = offset + Number(insets?.top ?? 0)
			const bottom = offset + Number(table.bounds?.size?.height ?? 0) - Number(insets?.bottom ?? 0)
			const rows: VisibleListRow[] = []
			const paths = Array.from(table.indexPathsForVisibleRows ?? []) as NSIndexPath[]
			for (const path of paths) {
				const index = Number(path.row)
				if (index < 0 || index >= state.items.length) {
					continue
				}

				const rect = table.rectForRowAtIndexPath(path)
				const rowTop = Number(rect.origin.y)
				const rowBottom = rowTop + Number(rect.size.height)
				const height = rowBottom - rowTop
				if (height <= 0) {
					continue
				}

				const intersection = Math.max(0, Math.min(bottom, rowBottom) - Math.max(top, rowTop))
				if (intersection > 0) {
					rows.push({ index, visiblePercent: (intersection / height) * 100 })
				}
			}

			state.update(rows, state.items, state.config)
		}, 0)
	}

	observer.callback = refresh
	// Observe contentOffset without replacing NativeScript's UITableView delegate.
	table.addObserverForKeyPathOptionsContext(
		observer,
		'contentOffset',
		// Ambient const enum — verbatimModuleSyntax forbids value access; New = 1.
		1,
		null as any,
	)

	refresh()
	return {
		refresh,
		dispose() {
			disposed = true
			if (timer !== null) {
				clearTimeout(timer)
			}

			observer.callback = null
			table.removeObserverForKeyPath(observer, 'contentOffset')
		},
	}
}
