/** Named haptic effects — UIKit feedback-generator equivalents on iOS,
 *  Android HapticFeedbackConstants where mapped, navigator.vibrate
 *  approximations on web. */
export type HapticPreset =
	| 'selection'
	| 'impact-light'
	| 'impact-medium'
	| 'impact-heavy'
	| 'success'
	| 'warning'
	| 'error'

/** One control point in a pattern: `at` is milliseconds into the pattern;
 *  `intensity`/`sharpness` are 0-1 (sharpness maps to iOS CHHaptic sharpness,
 *  ignored where the backend lacks the notion). */
export type HapticPoint = {
	/** Milliseconds into the pattern. */
	at: number
	/** Amplitude 0-1. */
	intensity: number
	/** Texture 0-1 — maps to iOS CHHaptic sharpness, ignored elsewhere. */
	sharpness?: number
}
/** A composed haptic pattern — a duration with sampled control points. */
export type HapticPattern = {
	/** Total pattern length in milliseconds. */
	duration: number
	/** Control points in time order. */
	points: readonly HapticPoint[]
}

/** What this host's haptic backend can do — check before enabling haptic UI. */
export type HapticsCapabilities = {
	/** Any haptic output path exists. */
	supported: boolean
	/** Named presets (impact/notification/selection) are playable. */
	presets: boolean
	/** Composed HapticPattern playback is supported. */
	patterns: boolean
	/** Continuous realtime sessions (startRealtime/update) are supported. */
	realtime: boolean
	/** Why supported is false, when known. */
	reason?: string
}

/** An open realtime haptic session from startRealtime(); stop() ends it. */
export type HapticSession = {
	/** Set the running intensity/sharpness (0-1). */
	update(intensity: number, sharpness?: number): void
	/** End this session. */
	stop(): void
}

/** Owned haptic engine — the richer counterpart to the `haptics` service's
 *  three-method façade. */
export interface Haptics {
	/** Inspect backend availability before enabling haptic UI. */
	capabilities(): HapticsCapabilities
	/** Fire a named preset; false when the backend can't play it. */
	play(preset: HapticPreset): boolean
	/** Play a composed pattern; false when patterns are unsupported. */
	playPattern(pattern: HapticPattern): boolean
	/** Open a continuous session; the session is inert where realtime is
	 *  unsupported. */
	startRealtime(intensity?: number, sharpness?: number): HapticSession
	/** Stop all current output. */
	stop(): void
	/** Release the engine; repeated disposal is safe. */
	dispose(): void
}

export declare function createHaptics(): Haptics

/** Minimal expo-haptics-shaped service surface. */
export interface HapticsImpl {
	/** One-shot impact of the given weight. */
	impact(style?: 'light' | 'medium' | 'heavy'): void
	/** Success/warning/error notification feedback. */
	notification(kind: 'success' | 'warning' | 'error'): void
	/** Selection-change feedback (picker ticks etc.). */
	selection(): void
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
