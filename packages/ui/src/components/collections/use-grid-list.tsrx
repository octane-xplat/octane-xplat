/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'

/** Default useGridList hook: custom native row queries are unavailable.
 * The AppKit GridList component owns a separate native row registry. */

/** Options for the custom-integration grid-list machinery. */
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
	/** Ref to attach on the grid container. */
	gridRef: Octane.Ref<any>
	/** Whether the grid keyboard-navigation machinery is wired. False on
	 * native custom integrations; the AppKit GridList component implements
	 * navigation separately through explicit native row registration. */
	isSupported: boolean
	/** Keyboard/focus handlers to spread on the grid container. */
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
