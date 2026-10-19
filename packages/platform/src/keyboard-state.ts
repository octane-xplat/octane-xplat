import { createKeyboardWindowRegistry } from './keyboard-registry'
import type { KeyboardRect } from './keyboard-geometry'

/** @internal Basic inset snapshot in dips; shared by framework keyboard adapters. */
export interface KeyboardWindowState {
	readonly inset: number
	/** Available window geometry, in dips. Null means it could not be measured. */
	readonly windowRect: KeyboardRect | null
	/** Actual movement is absent from destination-only compatibility sources. */
	readonly currentFrame: KeyboardRect | null
	readonly targetFrame: KeyboardRect | null
	readonly source: 'unknown' | 'destination' | 'native-frames'
}

/** @internal Unknown is distinct from a measured zero inset. */
export const unknownKeyboardState = (): KeyboardWindowState => ({
	inset: 0,
	windowRect: null,
	currentFrame: null,
	targetFrame: null,
	source: 'unknown',
})

/** @internal One registry across roots; native/window adapters supply observations.
 * Importing this module does not observe windows or change window modes. */
export const keyboardWindows = createKeyboardWindowRegistry(unknownKeyboardState)
