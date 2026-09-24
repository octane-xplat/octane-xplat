import type { DrawerProps } from './props';

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) return;
	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) node.setAttribute(key, String(value));
		else node[key] = value;
	}
}

export function Drawer(props: DrawerProps) @{
	<div
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-drawer', props.className]}
		style={props.style}
	>
		<div className="vx-drawer-main">{props.main}</div>
		@if (props.open) {
			<>
				<div className="vx-drawer-backdrop" aria-hidden="true"></div>
				<div className="vx-drawer-panel">{props.drawer}</div>
			</>
		}
	</div>
}
