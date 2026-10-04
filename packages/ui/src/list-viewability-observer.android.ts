import type { ListViewabilityConfig } from './props'
import type { VisibleListRow } from './list-viewability-core'
import { observeLoadedListPeer, type ListVisibilityObserver } from './list-viewability-runtime'

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
	reset: () => void,
): ListVisibilityObserver {
	return observeLoadedListPeer(
		list,
		() => list?.android as android.widget.AbsListView | undefined,
		native => {
			let observer: android.view.ViewTreeObserver | null = null
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
					const first = Number(native.getFirstVisiblePosition())
					const top = Number(native.getPaddingTop())
					const bottom = Number(native.getHeight()) - Number(native.getPaddingBottom())
					const rows: VisibleListRow[] = []
					for (let childIndex = 0; childIndex < native.getChildCount(); childIndex++) {
						const index = first + childIndex
						if (index < 0 || index >= state.items.length) {
							continue
						}

						const child = native.getChildAt(childIndex)
						const rowTop = Number(child.getTop())
						const rowBottom = Number(child.getBottom())
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

			const listener = new android.view.ViewTreeObserver.OnScrollChangedListener({
				onScrollChanged: refresh,
			})

			// The tree observer is additive; NativeScript retains its AbsListView listener.
			const detachObserver = () => {
				if (observer?.isAlive()) {
					observer.removeOnScrollChangedListener(listener)
				}

				observer = null
				if (timer !== null) {
					clearTimeout(timer)
				}

				timer = null
				scheduled = false
			}

			const attachObserver = () => {
				if (disposed) {
					return
				}

				const next = native.getViewTreeObserver()
				if (!next?.isAlive() || observer === next) {
					return
				}

				detachObserver()
				observer = next
				observer.addOnScrollChangedListener(listener)
				refresh()
			}

			const attachListener = new android.view.View.OnAttachStateChangeListener({
				onViewAttachedToWindow: attachObserver,
				onViewDetachedFromWindow: () => {
					detachObserver()
					reset()
				},
			})

			native.addOnAttachStateChangeListener(attachListener)
			attachObserver()
			return {
				refresh() {
					attachObserver()
					refresh()
				},
				dispose() {
					disposed = true
					native.removeOnAttachStateChangeListener(attachListener)
					detachObserver()
				},
			}
		},
		reset,
	)
}
