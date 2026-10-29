/** Normalized hardware-key event. key is the logical key, code the physical
 * key; empty code means the host did not supply one. No host object escapes. */
export interface KeyboardEvent {
	readonly key: string
	readonly code: string
	readonly altKey: boolean
	readonly ctrlKey: boolean
	readonly metaKey: boolean
	readonly shiftKey: boolean
	readonly repeat: boolean
	readonly isComposing: boolean
	readonly defaultPrevented: boolean
	preventDefault(): void
	stopPropagation(): void
}

/**
 * Options for `useKeyboard` — portable key press/release handlers.
 */
export interface UseKeyboardOptions {
	onKeyDown?: (event: KeyboardEvent) => void
	onKeyUp?: (event: KeyboardEvent) => void
}

/**
 * `useKeyboard` result — `keyboardProps` to spread onto the host.
 */
export interface UseKeyboardResult {
	/** Focusable DOM elements and native intrinsics on AppKit.
	 * Default mobile leaves do not implement a hardware-key attachment. */
	readonly isSupported: boolean
	keyboardProps: {
		onKeyDown?: (event: KeyboardEvent) => void
		onKeyUp?: (event: KeyboardEvent) => void
	}
}
