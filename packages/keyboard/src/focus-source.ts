import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type { FocusedInputState } from '@octane-xplat/platform/focused-input-state'
import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'

/** @internal Default adapter is explicitly unsupported. */
export const observeFocusedInput: KeyboardWindowSource<FocusedInputState> = (_window, notify) => {
	notify(unknownFocusedInputState())
	return () => {}
}

/** @internal Active readers install a measurement callback per actual window. */
export const focusRechecks = new Map<object, () => void>()
