import { useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'

/** Native leaf of useGridList — arrow-key grid navigation is a web
 *  keyboard convention, so the hook returns an inert prop bag with the
 *  same shape as the web leaf. */

export interface UseGridListOptions {
	/** Fixed column count; measured from layout when unset. */
	columns?: number
	/** Selector matching focusable rows inside the grid. Default '[role="row"]'. */
	rowSelector?: string
}

/**
 * `useGridList` result — resolved selection, item count, `isSupported` flag, and the handlers/ref the leaf wires up.
 */
export interface UseGridListResult {
	gridRef: Octane.Ref<any>
	/** Whether the grid keyboard-navigation machinery is wired. Arrow-key
	 *  grid navigation is a web convention — false on native, where the
	 *  returned `gridProps` stay empty. */
	isSupported: boolean
	gridProps: {
		onKeyDown?: (event: unknown) => void
		onFocus?: (event: unknown) => void
	}
}

/**
 * Internal machinery behind `GridList` — returns selection/keyboard state plus `isSupported` (false for grid keyboard nav on native). Prefer the `GridList` component; this hook is for custom integrations.
 *
 * @see GridListProps.
 */
export function useGridList(options: UseGridListOptions = {}): UseGridListResult {
	return { gridRef: useRef(null), isSupported: false, gridProps: {} }
}
