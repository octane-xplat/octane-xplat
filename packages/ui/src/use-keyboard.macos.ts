import { appKitHost } from './host-bridge'
import type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

/** Copy only portable keyboard fields; native view/event objects do not escape. */
function portable(event: KeyboardEvent): KeyboardEvent {
	return {
		key: event.key, code: event.code, altKey: event.altKey, ctrlKey: event.ctrlKey,
		metaKey: event.metaKey, shiftKey: event.shiftKey, repeat: event.repeat, isComposing: event.isComposing,
		get defaultPrevented() { return event.defaultPrevented },
		preventDefault: () => event.preventDefault(),
		stopPropagation: () => event.stopPropagation(),
	}
}

/** Attach to an AppKit native intrinsic (or a native ancestor of focusable
 * controls). Shared View/Pressable do not forward these props. The bridge
 * handles keyDown/keyUp, not modifier-only flagsChanged notifications. */
export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardResult {
	const isSupported = Boolean(appKitHost()?.keyboardEventsSupported)
	return {
		isSupported,
		keyboardProps: isSupported ? {
			onKeyDown: options.onKeyDown ? (event) => options.onKeyDown?.(portable(event)) : undefined,
			onKeyUp: options.onKeyUp ? (event) => options.onKeyUp?.(portable(event)) : undefined,
		} : {},
	}
}
