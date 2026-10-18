/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { DrawerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';

/** Self-drawn drawer — grid host: `main` fills the cell, backdrop + left
 *  panel overlay it while `open`. Identical pixels/behavior across targets
 *  (backdrop tap fires `onDismiss` on both). The edge-gesture plugin widget
 *  lives in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export function Drawer(props: DrawerProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const open = props.open ?? internal;
	const requestDismiss = () => {
		if (props.open === undefined) setInternal(false);
		props.onDismiss?.();
	};

	<masonview id={props.id} ref={(v: any) => applyEscapeProps(v, props)} className={cx('vx-drawer', props.className)} style={mergeStyle({display: "grid"}, props.style as any)}>
		<masonview className="vx-drawer-main" style={{display: "grid"}}>{props.main}</masonview>
		@if (open) {
			<>
				<masonview className="vx-drawer-backdrop" onTap={requestDismiss} style={{display: "flex"}}/>
				<masonview className="vx-drawer-panel" style={mergeStyle({display: "flex"}, {justifySelf: 'start'})}>{props.drawer}</masonview>
			</>
		}
	</masonview>
}
