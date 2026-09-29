import type { Clock } from './clock-types';
import type { Transition } from './types';
/** Terminal status; cancellation never masquerades as completion. */
export type AnimationResult = 'finished' | 'cancelled' | 'replaced';
/** A cancellable animation whose finished promise always settles. */
export interface AnimationControls {
    finished: Promise<AnimationResult>;
    stop(reason?: Exclude<AnimationResult, 'finished'>): void;
}
export declare function validateTransition(t: Transition): void;
export declare function runAnimation(clock: Clock, from: number, to: number, transition: Transition, update: (value: number) => void, complete?: () => void): AnimationControls;
