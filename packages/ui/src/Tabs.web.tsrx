import { createContext, useContext, useState } from 'octane';
import type { TabSpec, TabsProps } from './props';
import { Icon } from './Icon.web.tsrx';

import { canGoBack, layoutsFor, popRoute, screenFor, useModalRoute, useRoute } from './route.web';

export type { TabSpec } from './props';

// Stacks already presented by an ancestor Tabs — a nested Tabs inside a
// routed screen must not re-present the same stack, or the screen's subtree
// would recursively contain the route again (e.g. a stackless fixture inside
// a pushed screen that re-presents 'root').
const PresentedStacks: any = createContext(null);

/** Platform tab shell — web version: a button row + the active pane. The
 *  pane also acts as the route outlet for its `stack`; a route on the
 *  'root' stack covers the whole shell (native: root push covers tabs). */
export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(0);
	const active = props.selectedIndex ?? internal;
	const presented: Set<string> = useContext(PresentedStacks) ?? new Set();
	const rootRoute = useRoute('root');
	// Hooks must be unconditional — subscribe with the active pane's stack
	// name ('' never matches a route).
	const paneRoute = useRoute(props.tabs[active]?.stack ?? '');
	const modal = useModalRoute();
	// resolveScreen prop wins; the registerScreens table is the fallback —
	// one registration serves both platforms' outlets. Directory _layout
	// files wrap the resolved element either way (outermost → innermost).
	const resolve = (name: string, params: Record<string, unknown>) => {
		const C = screenFor(name);
		const el = props.resolveScreen
			? props.resolveScreen(name, params)
			: C
				? <C {...params} />
				: null;

		return layoutsFor(name).reduceRight((child, L) => <L>{child}</L>, el);
	};

	const routeProps = (route: NonNullable<typeof rootRoute> | NonNullable<typeof paneRoute>) => ({
		...route.params,
		...(route.context ?? {}),
		_pushed: canGoBack(route.stack),
		...(Object.prototype.hasOwnProperty.call(route, 'loaderData') ? { data: route.loaderData } : {}),
		...(Object.prototype.hasOwnProperty.call(route, 'loaderError') ? { error: route.loaderError } : {}),
	});

	const presentedWith = (stack: string) => new Set(presented).add(stack);
	const routed = rootRoute && !presented.has('root')
		? resolve(rootRoute.name, routeProps(rootRoute))
		: null;

	// A modal route overlays the shell without replacing it — the screen
	// gets a `close` prop (popRoute parity with the native showModal root).
	const modalContent = modal && !presented.has(modal.stack)
		? resolve(modal.name, { ...routeProps(modal), close: () => popRoute() })
		: null;

	<div className="vx-tabsroot" style={{ display: 'contents' }}>
	@if (routed) {
		<PresentedStacks value={presentedWith('root')}>
			<div className="vx-route">{routed}</div>
		</PresentedStacks>
	}
	@else {
	<div id={props.id} className={['vx-tabs', props.className]} style={{ ...(props.style?.height != null ? { flex: 'none' } : {}), ...props.style }}>
		<div className="vx-tabbar">
			@for (const t of props.tabs; key t.title) {
				<button
					className={['vx-tab', active === props.tabs.indexOf(t) ? 'active' : '']}
					onClick={() => {
						const i = props.tabs.indexOf(t);
						setInternal(i);
						props.onSelectedIndexChanged?.(i);
					}}
				>
					{t.icon ? <Icon name={t.icon} className="vx-tabicon" size={16} /> : null}
					{t.title}
				</button>
			}
		</div>
		<div className="vx-tabpane">
			{(paneRoute && !presented.has(paneRoute.stack)
				? <PresentedStacks value={presentedWith(paneRoute.stack)}>{resolve(paneRoute.name, routeProps(paneRoute))}</PresentedStacks>
				: null)
				?? props.tabs[active]?.render()}
		</div>
	</div>
	}
	@if (modalContent) {
		<div className="vx-modalroute">
			<button className="vx-modalroute-shade" aria-label="Dismiss" onClick={() => popRoute()} />
			<div className="vx-modalroute-body"><PresentedStacks value={presentedWith(modal?.stack ?? '')}>{modalContent}</PresentedStacks></div>
		</div>
	}
	</div>
}
