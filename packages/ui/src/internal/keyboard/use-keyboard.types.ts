/** Normalized hardware-key event. key is the logical key, code the physical
 * key; empty code means the host did not supply one. No host object escapes. */
export interface KeyboardEvent {
	/** Logical key value ('a', 'Enter', 'ArrowDown'). */
	readonly key: string
	/** Physical key position ('KeyA', 'ArrowDown'); empty when the host didn't supply one. */
	readonly code: string
	/** Alt/Option held. */
	readonly altKey: boolean
	/** Ctrl held. */
	readonly ctrlKey: boolean
	/** Meta/Cmd held. */
	readonly metaKey: boolean
	/** Shift held. */
	readonly shiftKey: boolean
	/** Key is held and repeating. */
	readonly repeat: boolean
	/** Inside an IME composition — handlers typically ignore it. */
	readonly isComposing: boolean
	/** A handler already called preventDefault. */
	readonly defaultPrevented: boolean
	/** Blocks the platform's default key handling. */
	preventDefault(): void
	/** Stops the event reaching ancestor handlers. */
	stopPropagation(): void
}

/**
 * Options for `useKeyboard` — portable key press/release handlers.
 */
export interface UseKeyboardOptions {
	/** Fires on key press. */
	onKeyDown?: (event: KeyboardEvent) => void
	/** Fires on key release. */
	onKeyUp?: (event: KeyboardEvent) => void
}

/**
 * `useKeyboard` result — `keyboardProps` to spread onto the host.
 */
export interface UseKeyboardResult {
	/** Focusable DOM elements and native intrinsics on AppKit.
	 * Default mobile leaves do not implement a hardware-key attachment. */
	readonly isSupported: boolean
	/** Spread onto the focusable host to receive hardware-key events. */
	keyboardProps: {
		/** Bound key-press handler. */
		onKeyDown?: (event: KeyboardEvent) => void
		/** Bound key-release handler. */
		onKeyUp?: (event: KeyboardEvent) => void
	}
}
