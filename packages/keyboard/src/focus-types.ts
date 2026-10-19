import type { FocusedInputState } from '@octane-xplat/platform/focused-input-state'

/** Focused input geometry in device-independent window coordinates. Identity
 * and scroll owners are opaque native/DOM handles. No text contents are read.
 * Unsupported targets return null geometry and false capabilities. */
export type FocusedInputSnapshot = FocusedInputState
/** A vertical scroll viewport containing the input, nearest owner first. */
export type { FocusedInputScrollOwner } from '@octane-xplat/platform/focused-input-state'

/** Separate focus/selection geometry from software-keyboard movement. */
export interface FocusedInputService {
	/** Cached read; does not start observation. */
	getSnapshot(host: object): FocusedInputSnapshot
	/** Observe identity, selection and layout changes; release on host removal.
	 * Geometry callbacks can occur each frame during native layout movement. */
	subscribe(host: object, listener: (snapshot: FocusedInputSnapshot) => void): () => void
	/** Refresh an actively observed host. No-op without a reader. */
	recheck(host: object): void
}
