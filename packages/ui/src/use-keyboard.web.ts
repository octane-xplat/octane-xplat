import type { KeyboardEvent as NormalizedKeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard'
export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard'

function normalize(event: NormalizedKeyboardEvent): NormalizedKeyboardEvent {
	return {
		key: event.key,
		code: event.code ?? '',
		altKey: Boolean(event.altKey),
		ctrlKey: Boolean(event.ctrlKey),
		metaKey: Boolean(event.metaKey),
		shiftKey: Boolean(event.shiftKey),
		repeat: Boolean(event.repeat),
		isComposing: Boolean(event.isComposing) || (event as unknown as { keyCode?: number }).keyCode === 229,
		get defaultPrevented() { return event.defaultPrevented },
		preventDefault: () => event.preventDefault(),
		stopPropagation: () => event.stopPropagation(),
	}
}

/** Spread keyboardProps onto a focusable DOM intrinsic, such as button.
 * Shared View/Pressable do not forward hardware-key props. */
export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardResult {
	return {
		isSupported: true,
		keyboardProps: {
			onKeyDown: options.onKeyDown ? (event) => options.onKeyDown?.(normalize(event)) : undefined,
			onKeyUp: options.onKeyUp ? (event) => options.onKeyUp?.(normalize(event)) : undefined,
		},
	}
}
