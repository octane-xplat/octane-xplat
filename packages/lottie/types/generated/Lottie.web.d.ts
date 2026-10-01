import type { LottieProps } from './props.js';
/**  Lottie — lottie-web's svg renderer in a plain container div. Everything
 *  is imperative: `src`/`data` rebuild the AnimationItem, the rest are
 *  method calls applied in effects. Progress is normalized 0..1
 *  (lottie-web speaks frames); durations arrive in seconds and are
 *  surfaced as ms. */
export declare function Lottie(props: LottieProps): import("octane/jsx-runtime").JSX.Element;
