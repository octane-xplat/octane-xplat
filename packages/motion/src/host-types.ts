import type { Target, Transition } from './types'

export interface DelegatedRequest {
	/** Channels the caller asked to animate. */
	target: Target
	/** Full channel-space destination: retained values plus the target. */
	dest: Target
	/** Effective native destination — `scale` folded into scaleX/scaleY. */
	eff: Target
	transition: Transition
}

/** A run handed to the platform animator; presentation state stays readable. */
export interface DelegatedRun {
	/** Reads current rendered values in effective channels (scale folded). */
	sample(): Target
	/** Stops the run at its presentation state; the model is synced to it. */
	cancel(): void
	finished: Promise<'finished' | 'cancelled'>
}

/** Gesture-target kinds: press covers whileTap, focus covers whileFocus. */
export type GestureKind = 'press' | 'focus'

export interface GestureCallbacks {
	start(): void
	end(): void
}

export interface HostAdapter {
	read(): Target
	write(values: Target): void
	restore(): void
	/**
	 * Run a declarative tween on the platform animator. Returns null to fall
	 * back to the JS engine.
	 */
	delegate?(request: DelegatedRequest): DelegatedRun | null
	/** Subscribe to a gesture lifecycle; returns an unsubscribe, or null if the
	 *  host cannot emit it (focus events only exist on focusable hosts). */
	gesture?(kind: GestureKind, callbacks: GestureCallbacks): (() => void) | null
}
