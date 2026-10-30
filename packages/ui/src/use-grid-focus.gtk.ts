import { useRef, useState } from 'octane'
import type { GridFocusOptions, GridFocusResult } from './use-grid-focus'
export type { GridFocusOptions, GridFocusResult }

/**
 * GTK `useGridFocus` — arrow-key navigation across the host's focusable
 * descendants. Cells are the focusable widgets under `ref.current` in
 * pre-order (document order on web). `onKeyDown` rides the renderer's
 * capture-phase key events: arrows move one cell, Home/End jump edges,
 * and handled keys are consumed so GTK's own directional navigation does
 * not double-move. `onFocusCell` focuses a cell by index.
 */
export function useGridFocus<T = any>(options: GridFocusOptions): GridFocusResult<T> {
	const ref = useRef<T | null>(null)
	const [focusIndex, setFocusIndex] = useState(0)
	const { columns } = options

	/** Outermost focusable descendants of the host widget in pre-order —
	 *  a cell's own descendants (labels, icons) are part of the cell, not
	 *  separate cells. Ref targets are the renderer's public-instance views
	 *  — the Gtk.Widget itself. */
	const cells = (): any[] => {
		const host: any = ref.current
		if (typeof host?.get_first_child !== 'function') {
			return []
		}
		const found: any[] = []
		const walk = (widget: any) => {
			for (let w = widget; w; w = w.get_next_sibling()) {
				if (w.get_can_focus?.() && w.get_visible?.() && w.get_is_sensitive?.() !== false) {
					found.push(w)
					continue
				}
				walk(w.get_first_child())
			}
		}
		walk(host.get_first_child())
		return found
	}

	const focusCell = (index: number) => {
		const list = cells()
		const clamped = Math.max(0, Math.min(index, list.length - 1))
		list[clamped]?.grab_focus?.()
	}

	const onKeyDown = (event: any) => {
		const host: any = ref.current
		if (!host) {
			return
		}
		const list = cells()
		const current = list.indexOf(host.get_root?.()?.get_focus?.())
		if (current < 0) {
			return
		}
		let next = current
		switch (event.key) {
			case 'ArrowRight':
				next = Math.min(current + 1, list.length - 1)
				break
			case 'ArrowLeft':
				next = Math.max(current - 1, 0)
				break
			case 'ArrowDown':
				next = Math.min(current + columns, list.length - 1)
				break
			case 'ArrowUp':
				next = Math.max(current - columns, 0)
				break
			case 'Home':
				next = 0
				break
			case 'End':
				next = list.length - 1
				break
			default:
				return
		}
		event.preventDefault?.()
		if (next !== current) {
			focusCell(next)
			setFocusIndex(next)
			options.onFocusChange?.(next)
		}
	}

	const onFocusCell = (index: number) => {
		focusCell(index)
		setFocusIndex(index)
	}

	return { ref, focusIndex, onKeyDown, onFocusCell }
}
