/** @jsxImportSource @nativescript-community/octane */
import { LiquidGlassContainer as NSLiquidGlassContainer } from '@nativescript/core';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import type { LiquidGlassContainerProps } from '../props';
import { cx } from '../cx';
import { applyEscapeProps } from '../escape-props';
import { layoutChildProps } from '../layout-child.native';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		liquidglasscontainer: Attributes<typeof NSLiquidGlassContainer>;
	}
}

registerElement('liquidglasscontainer', NSLiquidGlassContainer);

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
		style={props.style}
	>
		{props.children}
	</liquidglasscontainer>
}
