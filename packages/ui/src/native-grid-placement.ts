import { autoPlaceGridChildren } from './grid-auto-placement'
import { gridChildPlacement } from './grid-placement'
import { gridTrackListToSpec } from './grid-tracks'
import type { GridTrackList } from './props'

/** Reconcile Grid after both parent renders and independently committed child updates. */
export function bindNativeGridPlacement(
	host: any,
	rows?: GridTrackList,
	columns?: GridTrackList,
): () => void {
	const watched = new Set<any>()
	let disposed = false
	let queued = false
	const reconcile = () => {
		if (disposed) {
			return
		}

		const views: any[] = []
		host.eachChildView((view: any) => {
			views.push(view)
			return true
		})

		for (const view of watched) {
			if (!views.includes(view)) {
				view.off('xplatGridPlacementChange', schedule)
				watched.delete(view)
			}
		}

		for (const view of views) {
			if (!watched.has(view)) {
				view.on('xplatGridPlacementChange', schedule)
				watched.add(view)
			}
		}

		const items = views.map(gridChildPlacement)
		const placement = autoPlaceGridChildren(items, rows, columns)
		host.rows = gridTrackListToSpec(rows, 'rows', placement.rowCount) ?? ''
		host.columns = gridTrackListToSpec(columns, 'columns', placement.columnCount) ?? ''
		views.forEach((view, index) => {
			view.row = placement.cells[index].row
			view.col = placement.cells[index].col
			view.rowSpan = items[index].rowSpan ?? 1
			view.colSpan = items[index].colSpan ?? 1
		})
	}

	const schedule = () => {
		if (queued || disposed) {
			return
		}

		queued = true
		queueMicrotask(() => {
			queued = false
			reconcile()
		})
	}

	// Child owners can commit without re-rendering Grid. Observe the host's
	// mutation boundary, batching moves (remove + insert) after refs attach.
	const originals = new Map<
		string,
		{ own?: PropertyDescriptor; wrapper: (...args: any[]) => any }
	>()

	for (const key of ['addChild', 'insertChild', 'removeChild']) {
		const method = host[key]
		const wrapper = function (this: any, ...args: any[]) {
			const result = method.apply(this, args)
			schedule()
			return result
		}

		originals.set(key, { own: Object.getOwnPropertyDescriptor(host, key), wrapper })
		host[key] = wrapper
	}

	reconcile()
	return () => {
		disposed = true
		for (const view of watched) {
			view.off('xplatGridPlacementChange', schedule)
		}

		watched.clear()
		for (const [key, { own, wrapper }] of originals) {
			if (host[key] !== wrapper) {
				continue
			}

			if (own) {
				Object.defineProperty(host, key, own)
			} else {
				delete host[key]
			}
		}
	}
}
