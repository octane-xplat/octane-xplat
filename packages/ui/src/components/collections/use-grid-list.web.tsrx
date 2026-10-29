/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'

/** Web leaf of useGridList — the roving-tabindex + 2D arrow-key machinery
 *  React Aria's useGridList applies to the grid element. Returned gridProps
 *  spread onto the container: onKeyDown moves focus by one cell
 *  (Left/Right) or by the measured column count (Up/Down), Home/End jump
 *  to the first/last row. Column count comes from the `columns` option or
 *  is measured by counting rows sharing the first row's offsetTop, so
 *  auto-fill CSS grids navigate correctly without a fixed count. */

export interface UseGridListOptions {
	/** Fixed column count; measured from layout when unset. */
	columns?: number
	/** Selector matching focusable rows inside the grid. Default '[role="row"]'. */
	rowSelector?: string
}

export interface UseGridListResult {
	gridRef: Octane.Ref<any>
	/** Whether the grid keyboard-navigation machinery is wired — true on web;
	 *  the native leaf reports false and returns an empty `gridProps`. */
	isSupported: boolean
	gridProps: {
		onKeyDown?: (event: unknown) => void
		onFocus?: (event: unknown) => void
	}
}

function enabledRows(root: HTMLElement, selector: string): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
		(el) =>
			!el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.hidden,
	)
}

function columnCount(rows: HTMLElement[], fixed?: number): number {
	if (fixed && fixed > 0) {
		return fixed
	}

	if (!rows.length) {
		return 1
	}

	const top = rows[0].offsetTop
	let count = 0
	for (const row of rows) {
		if (row.offsetTop !== top) {
			break
		}

		count += 1
	}

	return Math.max(1, count)
}

export function useGridList(options: UseGridListOptions = {}): UseGridListResult {
	const ref = useRef<HTMLElement | null>(null)
	const opts = useRef(options)
	opts.current = options

	const focusAt = useCallback((index: number) => {
		const root = ref.current
		if (!root) {
			return
		}

		const rows = enabledRows(root, opts.current.rowSelector ?? '[role="row"]')
		if (!rows.length) {
			return
		}

		const clamped = ((index % rows.length) + rows.length) % rows.length
		rows[clamped]?.focus()
	}, [])

	const repairTabStop = useCallback(() => {
		const root = ref.current
		if (!root) {
			return
		}

		const rows = enabledRows(root, opts.current.rowSelector ?? '[role="row"]')
		if (rows.length && !rows.some((el) => el.tabIndex === 0)) {
			rows[0].tabIndex = 0
		}
	}, [])

	// Repair the roving stop as rows mount/unmount or toggle disabled.
	useEffect(() => {
		const root = ref.current
		if (!root) {
			return
		}

		repairTabStop()
		const mo = new MutationObserver(repairTabStop)
		mo.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['tabindex', 'disabled', 'aria-disabled', 'hidden'],
		})

		return () => mo.disconnect()
	}, [repairTabStop])

	const onKeyDown = useCallback(
		(raw: unknown) => {
			const e = raw as KeyboardEvent
			const root = ref.current
			if (!root) {
				return
			}

			const selector = opts.current.rowSelector ?? '[role="row"]'
			const rows = enabledRows(root, selector)
			const active = (e.target as HTMLElement | null)?.closest?.(selector) as HTMLElement | null
			const index = active ? rows.indexOf(active) : -1
			const cols = columnCount(rows, opts.current.columns)

			const move = (delta: number) => {
				e.preventDefault()
				const next = index < 0 ? (delta > 0 ? 0 : rows.length - 1) : index + delta
				focusAt(next)
			}

			switch (e.key) {
				case 'ArrowRight':
					move(1)
					break
				case 'ArrowLeft':
					move(-1)
					break
				case 'ArrowDown':
					move(cols)
					break
				case 'ArrowUp':
					move(-cols)
					break
				case 'Home':
					if (index >= 0) {
						e.preventDefault()
						focusAt(0)
					}

					break
				case 'End':
					if (index >= 0) {
						e.preventDefault()
						focusAt(-1)
					}

					break
			}
		},
		[focusAt],
	)

	// Keep the roving stop in sync after clicks/programmatic focus.
	const onFocus = useCallback((raw: unknown) => {
		const e = raw as FocusEvent
		const root = ref.current
		if (!root) {
			return
		}

		const selector = opts.current.rowSelector ?? '[role="row"]'
		const target = (e.target as HTMLElement | null)?.closest?.(selector) as HTMLElement | null
		if (!target) {
			return
		}

		for (const el of enabledRows(root, selector)) {
			el.tabIndex = el === target ? 0 : -1
		}
	}, [])

	return {
		gridRef: ref,
		isSupported: true,
		gridProps: { onKeyDown, onFocus },
	}
}
