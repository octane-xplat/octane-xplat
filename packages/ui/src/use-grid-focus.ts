/** `useGridFocus` — keyboard navigation for a 2-D grid of cells (Astryx
 *  `useGridFocus`). Returns a host ref and `onKeyDown`/`onFocus` wiring;
 *  on non-pointer hosts (native) it is a no-op returning the same shape. */
export interface GridFocusOptions {
	rows: number
	columns: number
	onFocusChange?: (index: number) => void
}

export interface GridFocusResult<T = any> {
	ref: { current: T | null }
	focusIndex: number
	onKeyDown: (event: any) => void
	onFocusCell?: (index: number) => void
}

export function useGridFocus<T = any>(options: GridFocusOptions): GridFocusResult<T> {
	return { ref: { current: null }, focusIndex: 0, onKeyDown: () => {} }
}
