import type { UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

/** Native hosts have no portable hardware-key attachment. */
export function useKeyboard(_options: UseKeyboardOptions = {}): UseKeyboardResult {
	return { isSupported: false, keyboardProps: {} }
}
