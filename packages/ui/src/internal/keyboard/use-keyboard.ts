import type { UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

/** Default mobile hosts have no portable hardware-key attachment.
 * AppKit selects a dedicated native-intrinsic adapter. */
export function useKeyboard(_options: UseKeyboardOptions = {}): UseKeyboardResult {
	return { isSupported: false, keyboardProps: {} }
}
