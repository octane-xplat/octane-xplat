import type { DrawerProps } from './props';

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) return;
	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) node.setAttribute(key, String(value));
		else node[key] = value;
	}
}

/** Self-drawn drawer — `main` fills the host, backdrop + left panel overlay
 *  it while `open`. Identical pixels/behavior across targets (backdrop
 *  click fires `onDismiss` on both). The edge-gesture plugin widget lives
 *  in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export function Drawer(props: DrawerProps) @{

	<div
		id={props.id}
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-drawer', props.className]}
		style={props.style}
	>
		<div className="vx-drawer-main">{props.main}</div>
		@if (props.open) {
			<>
				<div className="vx-drawer-backdrop" onClick={props.onDismiss} />
				<div className="vx-drawer-panel">{props.drawer}</div>
			</>
		}
	</div>
}
