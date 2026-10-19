import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

export type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

/** Lifecycle of one keyboard transition. An interrupted transition cancels
 * before the replacement starts; current geometry never jumps to its target. */
export type KeyboardPhase = 'idle' | 'start' | 'move' | 'end' | 'cancel'

/** Capabilities belong to the actual host window and active adapter. */
export interface KeyboardCapabilities {
	readonly geometry: boolean
	readonly nativeFrames: boolean
	readonly interactive: boolean
	readonly floating: boolean
}

/** Geometry is in device-independent coordinates in the owning window.
 * Null frames are unavailable; source distinguishes unknown from measured hidden.
 * A destination frame is never presented as measured intermediate movement. */
export interface KeyboardSnapshot {
	readonly inset: number
	readonly windowRect: KeyboardRect | null
	readonly currentFrame: KeyboardRect | null
	readonly targetFrame: KeyboardRect | null
	readonly source: 'unknown' | 'destination' | 'native-frames'
	readonly capabilities: KeyboardCapabilities
	readonly phase: KeyboardPhase
	readonly transitionId: number
	/** Unix milliseconds at delivery. */
	readonly timestampMs: number
	/** Native destination transition duration, or null when unknown. */
	readonly durationMs: number | null
}

export interface SoftwareKeyboardController {
	/** Activate shared native tracking until release. Observation starts only
	 * when a window has readers. Repeated activations share ownership. */
	activate(): () => void
	/** Read available cached state without activating observation. */
	getSnapshot(host: object): KeyboardSnapshot
	/** Observe destination/lifecycle changes, excluding per-frame movement. */
	subscribe(host: object, listener: (snapshot: KeyboardSnapshot) => void): () => void
	/** Observe measured movement directly; callbacks must not render per frame. */
	onMove(host: object, listener: (snapshot: KeyboardSnapshot) => void): () => void
}
