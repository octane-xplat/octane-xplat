import type { SetTranslate } from './props.js';
/** Imperative translate write on a bound view — the gesture seam. NS
 *  views carry real translateX/translateY properties (dips), so the write
 *  is a direct prop set — synchronous on the UI thread. */
export declare const setTranslate: SetTranslate;
