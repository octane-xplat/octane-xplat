import type { Clock } from './clock-types.js';
import type { Transition, TransitionInput, TransitionOrchestration, MotionKey } from './types.js';
/** Terminal status; cancellation never masquerades as completion. */
export type AnimationResult = 'finished' | 'cancelled' | 'replaced';
/** A cancellable animation whose finished promise always settles. */
export interface AnimationControls {
    finished: Promise<AnimationResult>;
    stop(reason?: Exclude<AnimationResult, 'finished'>): void;
}
export declare function isBezierEase(ease: Transition['ease']): boolean;
/** CSS cubic-bezier control points for a delegatable ease; tuples pass through. */
export declare function bezierPoints(ease: Transition['ease']): [number, number, number, number];
export declare function isOrchestrated(t: TransitionInput | undefined): t is TransitionOrchestration;
export declare function resolveTransition(t: TransitionInput, key: MotionKey): Transition;
export declare function validateTransition(t: Transition): void;
export declare function validateTransitionInput(t: TransitionInput): void;
export declare function runAnimation(clock: Clock, from: number, to: number, transition: Transition, update: (value: number) => void, complete?: () => void): AnimationControls;
