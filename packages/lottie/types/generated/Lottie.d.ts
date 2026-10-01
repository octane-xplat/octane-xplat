import { LottieView } from '@nativescript-community/ui-lottie';
import type { LottieProps } from './props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        xplatlottie: Attributes<typeof LottieView>;
    }
}
/**  Lottie — @nativescript-community/ui-lottie surface. The plugin doesn't
 *  diff props, so src/play-state/speed/progress land imperatively in
 *  effects. `async` is forced on: npm 6.0.0's sync src path is dead code
 *  (an uninitialized `LottieCompositionFactory` — fix lives on fork
 *  branch fix/android-sync-src). Readiness comes from the plugin's
 *  `compositionLoaded` event where it exists (fork feat/load-events),
 *  with a polling fallback for npm 6.0.0, where iOS never fires it and
 *  autoPlay is a no-op for async loads (fix/android-async-autoplay). */
export declare function Lottie(props: LottieProps): unknown;
