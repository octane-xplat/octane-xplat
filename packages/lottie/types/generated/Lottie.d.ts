import type { LottieProps } from './props.js';
/**  Lottie — vendored ui-lottie surface (see src/plugin). The plugin
 *  doesn't diff props, so src/play-state/speed/progress land imperatively
 *  in effects. `async` stays forced on: it keeps the load path uniform
 *  (one code path for inline/file/URL/.lottie) and avoids main-thread
 *  parse jank; autoPlay is re-applied when the composition lands. */
export declare function Lottie(props: LottieProps): unknown;
