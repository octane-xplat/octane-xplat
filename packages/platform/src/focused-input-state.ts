import { createKeyboardWindowRegistry, type KeyboardWindowRegistry } from './keyboard-registry'
import type { KeyboardRect } from './keyboard-geometry'

/** @internal One vertical scroll viewport, nearest owner first. Coordinates
 * are device-independent and relative to the same window as the input. */
export interface FocusedInputScrollOwner {
	readonly id: object
	readonly rect: KeyboardRect
	readonly offsetY: number
	readonly minOffsetY: number
	readonly maxOffsetY: number
}

/** @internal Geometry only: adapters never read or store input text. */
export interface FocusedInputState {
	readonly input: object | null
	readonly windowRect: KeyboardRect | null
	readonly inputRect: KeyboardRect | null
	/** Insertion point at the selection end; precision is explicit below. */
	readonly caretRect: KeyboardRect | null
	readonly selection: { readonly start: number; readonly end: number } | null
	readonly scrollOwners: readonly FocusedInputScrollOwner[]
	readonly capabilities: {
		readonly inputBounds: boolean
		readonly caretBounds: 'none' | 'native-rect' | 'insertion-line'
		readonly selection: boolean
	}
	/** Unix milliseconds at delivery; excluded from geometry equality. */
	readonly timestampMs: number
}

/** @internal Inactive/unsupported differs from a supported window without focus. */
export const unknownFocusedInputState = (): FocusedInputState => ({
	input: null,
	windowRect: null,
	inputRect: null,
	caretRect: null,
	selection: null,
	scrollOwners: [],
	capabilities: { inputBounds: false, caretBounds: 'none', selection: false },
	timestampMs: 0,
})

const sameRect = (a: KeyboardRect | null, b: KeyboardRect | null) =>
	a === b ||
	(!!a && !!b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height)

/** @internal Polling native geometry must not wake readers when nothing changed. */
export function sameFocusedInput(a: FocusedInputState, b: FocusedInputState): boolean {
	return (
		a.input === b.input &&
		sameRect(a.windowRect, b.windowRect) &&
		sameRect(a.inputRect, b.inputRect) &&
		sameRect(a.caretRect, b.caretRect) &&
		a.selection?.start === b.selection?.start &&
		a.selection?.end === b.selection?.end &&
		a.capabilities.inputBounds === b.capabilities.inputBounds &&
		a.capabilities.caretBounds === b.capabilities.caretBounds &&
		a.capabilities.selection === b.capabilities.selection &&
		a.scrollOwners.length === b.scrollOwners.length &&
		a.scrollOwners.every((owner, index) => {
			const next = b.scrollOwners[index]
			return (
				owner.id === next.id &&
				sameRect(owner.rect, next.rect) &&
				owner.offsetY === next.offsetY &&
				owner.minOffsetY === next.minOffsetY &&
				owner.maxOffsetY === next.maxOffsetY
			)
		})
	)
}

/** @internal Shared focus stream, independent of software-keyboard motion. */
export const focusedInputWindows: KeyboardWindowRegistry<FocusedInputState> =
	createKeyboardWindowRegistry(unknownFocusedInputState)
