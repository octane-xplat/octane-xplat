/** `useGridFocus` — keyboard navigation for a 2-D grid of cells (Astryx
 *  `useGridFocus`). Returns a host ref, `onKeyDown` and optional `onFocusCell` wiring;
 *  the default mobile leaf is a no-op. Web and AppKit have separate native-host
 *  implementations; AppKit uses marked managed cells rather than a DOM query. */
export interface GridFocusOptions {
	/** Grid row count — bounds arrow navigation. */
	rows: number
	/** Grid column count — bounds arrow navigation. */
	columns: number
	/** Reports focus-index changes as arrows move the active cell. */
	onFocusChange?: (index: number) => void
}

export interface GridFocusResult<T = any> {
	/** Attach to the grid container so the hook can wire keyboard input. */
	ref: { current: T | null }
	/** Active cell index (row-major). */
	focusIndex: number
	/** Key handler to spread onto the container — implements arrow navigation. */
	onKeyDown: (event: any) => void
	/** Focuses a cell directly, for leaves that manage focus imperatively. */
	onFocusCell?: (index: number) => void
}

/** Arrow-key focus navigation for a 2-D cell grid — no-op on the shared leaf; web and macOS have real implementations. */
export function useGridFocus<T = any>(options: GridFocusOptions): GridFocusResult<T> {
	return { ref: { current: null }, focusIndex: 0, onKeyDown: () => {} }
}
