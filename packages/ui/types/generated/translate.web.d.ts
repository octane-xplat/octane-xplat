import type { SetTranslate } from './props.js';
/** Imperative translate write on a bound view — the gesture seam. Called
 *  per frame from pan handlers (docs/animation-gestures.md: animation
 *  writes imperative, state stays declarative). Composes with other
 *  transform writes on the same element via ./transform.web. */
export declare const setTranslate: SetTranslate;
