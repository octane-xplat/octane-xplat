import type { UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

export type { KeyboardEvent, UseKeyboardOptions, UseKeyboardResult } from './use-keyboard.types'

/**
 * GTK leaf — widget-scoped `Gtk.EventControllerKey`. The renderer wires
 * `onKeyDown`/`onKeyUp` on any host element in capture phase, so
 * keyboardProps spread onto a container see keys bound for focused
 * descendants, and `preventDefault`/`stopPropagation` genuinely suppress
 * the target widget's own handling. The payload arrives already
 * normalized (DOM key names, modifier flags; `code` empty, `repeat` and
 * `isComposing` always false — see linux-gtk known-limits).
 */
export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardResult {
	return {
		isSupported: true,
		keyboardProps: {
			onKeyDown: options.onKeyDown,
			onKeyUp: options.onKeyUp,
		},
	}
}
