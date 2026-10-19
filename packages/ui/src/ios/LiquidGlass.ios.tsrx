/** @jsxImportSource @nativescript-community/octane */
import { LiquidGlass as NSLiquidGlass } from '@nativescript/core';
import { LiquidGlassView } from './liquid-glass-view.ios';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import type { LiquidGlassProps } from '../props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from '../escape-props';
import { layoutChildProps } from '../layout-child';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		liquidglass: Attributes<typeof NSLiquidGlass>;
	}
}

// The driver needs an intrinsic registration for the fallback-aware core view.
registerElement('liquidglass', LiquidGlassView);

/** System material blur before iOS 26; native glass on iOS 26+.
 *  Glass touch tracking is opt-in to avoid the reported child interception path.
 *  Explicit interactive glass with children still needs device qualification. */
export function LiquidGlass(props: LiquidGlassProps) @{
	<liquidglass id={props.id} ref={(v: any) => applyEscapeProps(v, props)} {...layoutChildProps(props, props.style as any)} iosGlassEffect={{
			variant: props.variant ?? 'regular',
			interactive: props.interactive ?? false,
			tint: props.tint,
			animateChangeDuration: props.animateChangeDuration,
		}} className={cx('vx-glass', props.variant === 'clear' ? 'vx-glass--clear' : undefined, props.className)}>
		{props.children}
	</liquidglass>
}
