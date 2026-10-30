import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

export type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

/** Lifecycle of one keyboard transition. An interrupted transition cancels
 * before the replacement starts; current geometry never jumps to its target. */
export type KeyboardPhase = 'idle' | 'start' | 'move' | 'end' | 'cancel'

/** Capabilities belong to the actual host window and active adapter. */
export interface KeyboardCapabilities {
	/** Real keyboard geometry is available (false on desktop with no software keyboard). */
	readonly geometry: boolean
	/** Per-frame native animation frames are delivered (iOS keyboard notifications). */
	readonly nativeFrames: boolean
	/** Interactive drag-to-dismiss movement is reported. */
	readonly interactive: boolean
	/** Floating/undocked keyboards (iPad) are distinguished from docked ones. */
	readonly floating: boolean
}

/** Geometry is in device-independent coordinates in the owning window.
 * Null frames are unavailable; source distinguishes unknown from measured hidden.
 * A destination frame is never presented as measured intermediate movement. */
export interface KeyboardSnapshot {
	/** Occluded height at the window's bottom edge — the layout-safe value
	 *  for bottom insets; 0 when the keyboard is hidden or absent. */
	readonly inset: number
	/** Keyboard frame in window coordinates, or null when unmeasurable. */
	readonly windowRect: KeyboardRect | null
	/** Currently visible frame — during animation it lags targetFrame; null
	 *  when hidden or unmeasured. */
	readonly currentFrame: KeyboardRect | null
	/** The frame the current transition is animating toward, or null. */
	readonly targetFrame: KeyboardRect | null
	/** Provenance of the numbers: 'unknown' before any native report,
	 *  'destination' for transition targets, 'native-frames' for measured movement. */
	readonly source: 'unknown' | 'destination' | 'native-frames'
	/** Host capability flags for this window — see KeyboardCapabilities. */
	readonly capabilities: KeyboardCapabilities
	/** Lifecycle position of the current transition. */
	readonly phase: KeyboardPhase
	/** Monotonic id per transition — interrupted transitions bump it so
	 *  listeners can discard stale animation state. */
	readonly transitionId: number
	/** Unix milliseconds at delivery. */
	readonly timestampMs: number
	/** Native destination transition duration, or null when unknown. */
	readonly durationMs: number | null
}

/** Host-window keyboard observation service. activate() shares native
 *  tracking across callers; snapshots are per-host-window. */
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
