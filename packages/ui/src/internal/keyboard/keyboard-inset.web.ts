import { unknownKeyboardState } from '@octane-xplat/platform/keyboard-state'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'

const inactive = unknownKeyboardState()
/** @internal Neutral counterpart to the native integration seam. */
export const observeKeyboardDestination: KeyboardWindowSource<KeyboardWindowState> = (
	_window,
	publish,
) => {
	publish(inactive)
	return () => {}
}

/** @internal Web software-keyboard observation remains neutral. */
export function subscribeKeyboardState(
	notify: (state: KeyboardWindowState, windowKey?: object) => void,
	_host?: unknown,
	_resize = true,
): () => void {
	notify(inactive)
	return () => {}
}

/** @internal No software-keyboard window source is selected on web. */
export function keyboardWindowForHost(_host: unknown): object | undefined {
	return undefined
}

/** @internal Stable neutral snapshot without observation. */
export function keyboardSnapshotForHost(_host: unknown): KeyboardWindowState {
	return inactive
}

/** @internal Native movement has a neutral browser counterpart. */
export function keyboardHostOverlap(
	_host: unknown,
	_state: KeyboardWindowState,
	_translationY = 0,
): number {
	return 0
}

/** @internal Native movement has a neutral browser counterpart. */
export function keyboardHostDisplacement(
	_host: unknown,
	_state: KeyboardWindowState,
	_translationY = 0,
): number {
	return 0
}

/** @internal Numeric compatibility counterpart. */
export function subscribeKeyboardInset(
	notify: (inset: number) => void,
	_host?: unknown,
): () => void {
	notify(0)
	return () => {}
}

/** The browser viewport handles the software keyboard without moving sheets. */
export function bindBottomInsetToKeyboard(_host: unknown): () => void {
	return () => {}
}
