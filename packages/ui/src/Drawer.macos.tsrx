/** @jsxImportSource @xplat/macos/renderer */
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
		{/* Backdrop + panel are sibling @ifs (a fragment inside @if is not
		   lowered on this target). Chrome metrics live inline — AppKit has
		   no CSS layer; keep in step with .vx-drawer-* in tokens.css. */}
		@if (props.open) {
			<flexboxlayout className="vx-drawer-backdrop" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} onTap={props.onDismiss} />
		}
		@if (props.open) {
			<flexboxlayout className="vx-drawer-panel" horizontalAlignment="left" style={{ width: 280, backgroundColor: '#ffffff' }}>{props.drawer}</flexboxlayout>
		}
	</gridlayout>
}
