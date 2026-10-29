import type { UseKeyboardInsetOptions } from '../../props'

/** Software keyboard inset is unsupported on this target and returns zero. */
export function useKeyboardInset(_options?: UseKeyboardInsetOptions): number {
	return 0
}
