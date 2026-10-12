/** React Aria's useKeyboard: wrap onKeyDown/onKeyUp into a keyboardProps
 *  bag to spread onto a focusable element. Events pass through as the
 *  platform's native event object (KeyboardEvent on web). */
export interface UseKeyboardOptions {
	onKeyDown?: (event: unknown) => void
	onKeyUp?: (event: unknown) => void
}

export interface UseKeyboardResult {
	keyboardProps: {
		onKeyDown?: (event: unknown) => void
		onKeyUp?: (event: unknown) => void
	}
}

export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardResult {
	return {
		keyboardProps: {
			onKeyDown: options.onKeyDown,
			onKeyUp: options.onKeyUp,
		},
	}
}
