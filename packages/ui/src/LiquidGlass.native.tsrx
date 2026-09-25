/** @jsxImportSource @nativescript-community/octane */
import { LiquidGlass as NSLiquidGlass } from '@nativescript/core';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import type { LiquidGlassProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.native';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		liquidglass: Attributes<typeof NSLiquidGlass>;
	}
}

// Core ships the class (a GridLayout whose root is an interactive
// UIVisualEffectView + UIGlassEffect) but the driver's intrinsic map was
// generated before it existed — register like any plugin view.
registerElement('liquidglass', NSLiquidGlass);

/** LiquidGlass — the element root is the glass surface itself: touch-tracking
 *  UIGlassEffect on iOS 26+, inert GridLayout on Android / iOS < 26. The
 *  effect is always applied as a config object: the upstream string
 *  shorthand rebuilds the effect without `interactive` on prop updates. */
export function LiquidGlass(props: LiquidGlassProps) @{
	<liquidglass
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		{...layoutChildProps(props)}
		iosGlassEffect={{
			variant: props.variant ?? 'regular',
			interactive: props.interactive ?? true,
			tint: props.tint,
			animateChangeDuration: props.animateChangeDuration,
		}}
		className={cx('vx-glass', props.variant === 'clear' ? 'vx-glass--clear' : undefined, props.className)}
		style={props.style}
	>
		{props.children}
	</liquidglass>
}
