/** @jsxImportSource @nativescript-community/octane */
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

	<masonview display="grid" id={props.id} ref={(v: any) => applyEscapeProps(v, props)} className={cx('vx-drawer', props.className)} style={props.style as any}>
		<masonview display="grid" className="vx-drawer-main">{props.main}</masonview>
		@if (open) {
			<>
				<masonview display="flex" className="vx-drawer-backdrop" onTap={requestDismiss} />
				<masonview display="flex" className="vx-drawer-panel" style={{justifySelf: 'start'}}>{props.drawer}</masonview>
			</>
		}
	</masonview>
}
