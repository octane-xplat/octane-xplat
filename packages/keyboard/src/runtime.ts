import { unknownKeyboardState } from '@octane-xplat/platform/keyboard-state'
import type { KeyboardRuntime } from './runtime-types'

const state = unknownKeyboardState()

/** Web and desktop retain neutral software-keyboard behavior. */
export const keyboardRuntime: KeyboardRuntime = {
	activate: () => () => {},
	subscribe(_host, listener) {
		listener(state)
		return () => {}
	},
	getSnapshot: () => state,
	property: () => null,
	overlap: () => 0,
}
