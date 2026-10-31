import type { Clock } from './clock-types.js';
import type { Transition } from './types.js';
import { type AnimationControls } from './engine.js';
/** Events supported by numeric motion values. */
export interface MotionValueEvents {
    change: (value: number) => void;
    animationStart: () => void;
    animationComplete: () => void;
    animationCancel: () => void;
    destroy: () => void;
}
/** Numeric value with direct subscriptions; it does not subscribe Octane renders. */
export declare class MotionValue {
    private clock;
    private current;
    private previous;
    private velocity;
    private updated;
    private controls?;
    private generation;
    private listeners;
    private passive?;
    private disposed;
    constructor(initial: number, clock: Clock);
    private assert;
    /** Read the current sample. */
    get(): number;
    /** Read the previous sample. */
    getPrevious(): number;
    /** Velocity in units per second; stale samples have zero velocity. */
    getVelocity(): number;
    /** Set immediately, or animate when this is a useSpring value. */
    set(value: number): void;
    /** Snap and stop current playback, resetting velocity. */
    jump(value: number): void;
    /** Subscribe without causing a component render. Returns an unsubscribe function. */
    on<K extends keyof MotionValueEvents>(event: K, callback: MotionValueEvents[K]): () => void;
    private emit;
    private write;
    /** Update position bookkeeping without emitting — platform-delegated runs
     *  track presentation state so interruption reads fresh value/velocity. */
    track(value: number): void;
    /** Animate to a destination. New playback replaces old playback.
     *  `type: 'inertia'` ignores `target` — pass `value.get()` and steer with
     *  `velocity`, `power`, `timeConstant`, `min`, `max`. */
    animate(target: number, transition?: Transition, clampSample?: (value: number) => number): AnimationControls;
    /** Stop playback at its current value. */
    stop(reason?: 'cancelled' | 'replaced'): void;
    /** Release playback and listeners when the owning component unmounts. */
    destroy(): void;
    /** @internal Install the useSpring setter interception. */
    attach(setter: (value: number) => void): () => void;
}
