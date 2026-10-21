/** @jsxImportSource @nativescript-community/octane */
import { LiquidGlassContainer as NSLiquidGlassContainer } from '@nativescript/core';
import { LiquidGlassContainerView } from './liquid-glass-container-view.ios';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import type { LiquidGlassContainerProps } from '../props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from '../escape-props';
import { layoutChildProps } from '../layout-child';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		liquidglasscontainer: Attributes<typeof NSLiquidGlassContainer>;
	}
}

// The driver needs an intrinsic registration for the padding-aware core view.
registerElement('liquidglasscontainer', LiquidGlassContainerView);

/** LiquidGlassContainer — merged-glass region (UIGlassContainerEffect):
 *  glass siblings inside morph together across `spacing` dips. The native
 *  host is an AbsoluteLayout — children position via left/top, or nest a
 *  layout primitive inside and let the glass effects merge spatially.
 *  Inert layout on iOS < 26. */
export function LiquidGlassContainer(props: LiquidGlassContainerProps) @{
	<liquidglasscontainer
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		{...layoutChildProps(props)}
		iosGlassEffect={{ spacing: props.spacing ?? 8 }}
		className={cx('vx-glass-container', props.className)}
	>
		{props.children}
	</liquidglasscontainer>
}
