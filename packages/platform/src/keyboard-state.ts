import { createKeyboardWindowRegistry } from './keyboard-registry'

/** @internal Basic inset snapshot in dips; shared by framework keyboard adapters. */
export interface KeyboardWindowState {
	readonly inset: number
}

/** @internal One registry across roots; native/window adapters supply observations.
 * Importing this module does not observe windows or change window modes. */
export const keyboardWindows = createKeyboardWindowRegistry<KeyboardWindowState>(() => ({
	inset: 0,
}))
