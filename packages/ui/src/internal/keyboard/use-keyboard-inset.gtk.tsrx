import type { UseKeyboardInsetOptions } from '../../props'

/** Software keyboard inset is unsupported on this target and returns zero —
 *  X11/GTK desktop has no on-screen keyboard resizing contract. */
export function useKeyboardInset(_options?: UseKeyboardInsetOptions): number {
	return 0
}
