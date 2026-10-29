/** `useGridFocus` — keyboard navigation for a 2-D grid of cells (Astryx
 *  `useGridFocus`). Returns a host ref, `onKeyDown` and optional `onFocusCell` wiring;
 *  the default mobile leaf is a no-op. Web and AppKit have separate native-host
 *  implementations; AppKit uses marked managed cells rather than a DOM query. */
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
