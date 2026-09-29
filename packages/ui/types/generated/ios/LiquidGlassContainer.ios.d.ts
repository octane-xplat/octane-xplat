import { LiquidGlassContainer as NSLiquidGlassContainer } from '@nativescript/core';
import type { LiquidGlassContainerProps, PlatformWidgetProps } from '../props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        liquidglasscontainer: Attributes<typeof NSLiquidGlassContainer>;
    }
}
/**  LiquidGlassContainer — merged-glass region (UIGlassContainerEffect):
 *  glass siblings inside morph together across `spacing` dips. The native
 *  host is an AbsoluteLayout — children position via left/top, or nest a
 *  layout primitive inside and let the glass effects merge spatially.
 *  Inert layout on iOS < 26. */
export declare function LiquidGlassContainer(props: PlatformWidgetProps<LiquidGlassContainerProps>): unknown;
