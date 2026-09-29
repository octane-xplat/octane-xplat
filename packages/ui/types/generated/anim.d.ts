/**
 * Imperative animation value (decision #10 — no worklets; JS runs on the UI
 * thread on NS so a rAF tween writes the view directly). `bind` is a leaf
 * `bind` prop target: the leaf forwards it to the intrinsic's `ref`, and the
 * runtime hands us the NS view. */
export type { AnimatedValue } from './props.js';
import type { AnimatedValue } from './props.js';
/**  useAnimation — a stable animated value across renders. `prop` is the NS
 *  view property written per frame (translateX default). */
export declare function useAnimation(initial?: number, prop?: string): AnimatedValue;
