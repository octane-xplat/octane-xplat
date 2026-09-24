import { useState } from 'octane';
import type { TabSpec, TabsProps } from './props';

import { screenFor, useRoute } from './route.web';

export type { TabSpec } from './props';

/** Platform tab shell — web version: a button row + the active pane. The
 *  pane also acts as the route outlet for its `stack`; a route on the
 *  'root' stack covers the whole shell (native: root push covers tabs). */
export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(0);
	const active = props.selectedIndex ?? internal;
	const rootRoute = useRoute('root');
	// Hooks must be unconditional — subscribe with the active pane's stack
	// name ('' never matches a route).
	const paneRoute = useRoute(props.tabs[active]?.stack ?? '');
	// resolveScreen prop wins; the registerScreens table is the fallback —
	// one registration serves both platforms' outlets.
	const resolve = (name: string, params: Record<string, unknown>) => {
		if (props.resolveScreen) return props.resolveScreen(name, params);
		const C = screenFor(name);
		return C ? <C {...params} /> : null;
	};
	const routed = rootRoute ? resolve(rootRoute.name, rootRoute.params) : null;
	@if (routed) {
		<div className="vx-route">{routed}</div>
	}
	@else {
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
		<div className="vx-tabpane">
			{(paneRoute ? resolve(paneRoute.name, paneRoute.params) : null)
				?? props.tabs[active]?.render()}
		</div>
	</div>
	}
}
