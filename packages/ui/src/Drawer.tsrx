/** @jsxImportSource @nativescript-community/octane */
import type { DrawerProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

/** Self-drawn drawer — grid host: `main` fills the cell, backdrop + left
 *  panel overlay it while `open`. Identical pixels/behavior across targets
 *  (backdrop tap fires `onDismiss` on both). The edge-gesture plugin widget
 *  lives in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export function Drawer(props: DrawerProps) @{
	<gridlayout
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		className={cx('vx-drawer', props.className)}
		style={props.style}
	>
		<gridlayout className="vx-drawer-main">{props.main}</gridlayout>
		@if (props.open) {
			<>
				<flexboxlayout className="vx-drawer-backdrop" onTap={props.onDismiss} />
				<flexboxlayout className="vx-drawer-panel" horizontalAlignment="left">{props.drawer}</flexboxlayout>
			</>
		}
	</gridlayout>
}
