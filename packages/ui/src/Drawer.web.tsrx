import type { DrawerProps } from './props';

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) return;
	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) node.setAttribute(key, String(value));
		else node[key] = value;
	}
}

export function Drawer(props: DrawerProps) @{
	const Main = props.main;
	const Panel = props.drawer;

	<div
		id={props.id}
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-drawer', props.className]}
		style={props.style}
	>
		<div className="vx-drawer-main">
			@if (Main != null) {
				<Main />
			}
		</div>
		@if (props.open && Panel != null) {
			<>
				<div className="vx-drawer-backdrop" aria-hidden="true"></div>
				<div className="vx-drawer-panel"><Panel /></div>
			</>
		}
	</div>
}
