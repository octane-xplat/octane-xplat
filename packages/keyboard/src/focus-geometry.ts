import { isKeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'
import type { FocusedInputState } from '@octane-xplat/platform/focused-input-state'

/** @internal Convert a plain CGRect/NSRect value, never an SDK object in shared policy. */
export function focusRect(value: any): KeyboardRect | null {
	const rect = value && {
		x: value.origin?.x,
		y: value.origin?.y,
		width: value.size?.width,
		height: value.size?.height,
	}
	return isKeyboardRect(rect) ? rect : null
}

/** @internal Selection metadata only; invalid native ranges are unavailable. */
export function focusSelection(start: number, end: number): FocusedInputState['selection'] {
	return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && end >= 0
		? { start, end }
		: null
}

/** @internal A supported window without an editing input. */
export function emptyFocus(
	windowRect: KeyboardRect | null,
	caretBounds: FocusedInputState['capabilities']['caretBounds'],
): FocusedInputState {
	return {
		...unknownFocusedInputState(),
		windowRect,
		capabilities: { inputBounds: true, caretBounds, selection: true },
	}
}
