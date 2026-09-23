import { useState } from 'octane';

export interface TabSpec {
	title: string;
	render: () => any;
}

/** Platform tab shell — web version: a button row + the active pane. */
export function Tabs(props: {
	className?: any;
	style?: any;
	id?: string;
	tabs: readonly TabSpec[];
	selectedIndex?: number;
	onSelectedIndexChanged?: (index: number) => void;
}) @{
	const [internal, setInternal] = useState(0);
	const active = props.selectedIndex ?? internal;
	<div id={props.id} className={['vx-tabs', props.className]} style={props.style}>
		<div className="vx-tabbar">
			@for (const t of props.tabs; key t.title) {
				<button
					className={['vx-tab', active === props.tabs.indexOf(t) ? 'active' : '']}
					onClick={() => {
						const i = props.tabs.indexOf(t);
						setInternal(i);
						props.onSelectedIndexChanged?.(i);
					}}
				>{t.title}</button>
			}
		</div>
		<div className="vx-tabpane">{props.tabs[active]?.render()}</div>
	</div>
}
