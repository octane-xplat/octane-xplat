import { useRef, useState } from 'octane'
import type { GridFocusOptions, GridFocusResult } from './use-grid-focus'
export type { GridFocusOptions, GridFocusResult }

/** Web `useGridFocus` — roving-tabindex arrow-key grid navigation. The host
 *  carries `onKeyDown`; cells opt into focus management via
 *  `data-grid-cell` + `tabIndex`. Home/End jump edges, arrows move one cell
 *  (row-aware Left/Right, column-aware Up/Down). */
export function useGridFocus<T extends HTMLElement = HTMLElement>(
	options: GridFocusOptions,
): GridFocusResult<T> {
	const ref = useRef<T | null>(null)
	const [focusIndex, setFocusIndex] = useState(0)
	const { rows, columns } = options

	const focusCell = (index: number) => {
		const host = ref.current
		if (!host) {
			return
		}
		const cells = host.querySelectorAll('[data-grid-cell]')
		const clamped = Math.max(0, Math.min(index, cells.length - 1))
		const el = cells[clamped] as HTMLElement | undefined
		el?.focus()
	}

	const onKeyDown = (event: KeyboardEvent) => {
		const host = ref.current
		if (!host) {
			return
		}
		const cells = [...host.querySelectorAll('[data-grid-cell]')] as HTMLElement[]
		const current = cells.indexOf(document.activeElement as HTMLElement)
		if (current < 0) {
			return
		}
		let next = current
		switch (event.key) {
			case 'ArrowRight':
				next = Math.min(current + 1, cells.length - 1)
				break
			case 'ArrowLeft':
				next = Math.max(current - 1, 0)
				break
			case 'ArrowDown':
				next = Math.min(current + columns, cells.length - 1)
				break
			case 'ArrowUp':
				next = Math.max(current - columns, 0)
				break
			case 'Home':
				next = 0
				break
			case 'End':
				next = cells.length - 1
				break
			default:
				return
		}
		event.preventDefault()
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
