import { useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'

/** Native leaf of useGridList — arrow-key grid navigation is a web
 *  keyboard convention, so the hook returns an inert prop bag with the
 *  same shape as the web leaf. */

export interface UseGridListOptions {
	/** Fixed column count; measured from layout when unset. */
	columns?: number;
	/** Selector matching focusable rows inside the grid. Default '[role="row"]'. */
	rowSelector?: string;
}

export interface UseGridListResult {
	gridRef: Octane.Ref<any>
	gridProps: {
		onKeyDown?: (event: unknown) => void
		onFocus?: (event: unknown) => void
	}
}

export function useGridList(options: UseGridListOptions = {}): UseGridListResult {
	return { gridRef: useRef(null), gridProps: {} }
}
