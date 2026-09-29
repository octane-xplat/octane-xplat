import { LiquidGlass as NSLiquidGlass } from '@nativescript/core';
import type { LiquidGlassProps, PlatformWidgetProps } from '../props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        liquidglass: Attributes<typeof NSLiquidGlass>;
    }
}
/**  LiquidGlass — the element root is the glass surface itself: touch-tracking
 *  UIGlassEffect on iOS 26+, inert GridLayout on older iOS. The effect is
 *  always applied as a config object: the upstream string shorthand rebuilds
 *  the effect without `interactive` on prop updates. */
export declare function LiquidGlass(props: PlatformWidgetProps<LiquidGlassProps>): unknown;
