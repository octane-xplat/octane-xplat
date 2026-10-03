import { createContext, useContext, useId, useState } from 'octane';
import type { TabSpec, TabsProps } from './props';
import { TabList, Tab } from './TabList.web.tsrx';

import {
	canGoBack,
	errorBoundaryFor,
	layoutsFor,
	popRoute,
	screenFor,
	useModalRoute,
	useRoute,
} from './route.web';

import { RouteBoundary } from './RouteBoundary.web.tsrx';

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
	const panelId = useId();
	const presented: Set<string> = useContext(PresentedStacks) ?? new Set();
	const rootRoute = useRoute('root');
	// Hooks must be unconditional — subscribe with the active pane's stack
	// name ('' never matches a route).
	const paneRoute = useRoute(props.tabs[active]?.stack ?? '');
	const modal = useModalRoute();
	// resolveScreen prop wins; the registerScreens table is the fallback —
	// one registration serves both platforms' outlets. Directory _layout
	// files wrap the resolved element either way (outermost → innermost).
	const resolve = (
		name: string,
		params: Record<string, unknown>,
		route: NonNullable<typeof rootRoute> | NonNullable<typeof paneRoute>,
	) => {
		const C = screenFor(name);
		const el = props.resolveScreen
			? props.resolveScreen(name, params)
			: C
				? <C {...params} />
				: null;

		const content = layoutsFor(name).reduceRight((child, L) => <L>{child}</L>, el);

		return (
			<RouteBoundary boundary={errorBoundaryFor(name)} route={route}>
				{content}
			</RouteBoundary>
		);
	};

	const routeProps = (route: NonNullable<typeof rootRoute> | NonNullable<typeof paneRoute>) => ({
		...route.params,
		...(route.context ?? {}),
		_pushed: canGoBack(route.stack),
		...(Object.prototype.hasOwnProperty.call(route, 'loaderData') ? { data: route.loaderData } : {}),
		...(Object.prototype.hasOwnProperty.call(route, 'loaderError') ? { error: route.loaderError } : {}),
		...(route.loaderPending === true ? { pending: true } : {}),
	});

	const presentedWith = (stack: string) => new Set(presented).add(stack);
	const routed = rootRoute && !presented.has('root')
		? resolve(rootRoute.name, routeProps(rootRoute), rootRoute)
		: null;

	// A modal route overlays the shell without replacing it — the screen
	// gets a `close` prop (popRoute parity with the native showModal root).
	const modalContent = modal && !presented.has(modal.stack)
		? resolve(modal.name, { ...routeProps(modal), close: () => popRoute() }, modal)
		: null;

	<div className="vx-tabsroot" style={{ display: 'contents' }}>
	@if (routed) {
		<PresentedStacks value={presentedWith('root')}>
			<div className="vx-route">{routed}</div>
		</PresentedStacks>
	}
	@else {
	<div id={props.id} className={['vx-tabs', props.className]} style={{ ...(props.style?.height != null ? { flex: 'none' } : {}), ...props.style }}>
		<TabList
			className="vx-tabbar"
			role="tablist"
			layout="fill"
			hasDivider
			value={String(active)}
			onChange={(v) => {
				const i = Number(v);
				setInternal(i);
				props.onSelectedIndexChanged?.(i);
			}}
		>
			@for (const t of props.tabs; index i; key t.title) {
				<Tab value={String(i)} label={t.title} icon={t.icon} panelId={panelId} id={panelId + '-tab-' + i} />
			}
		</TabList>
		<div className="vx-tabpane" role="tabpanel" id={panelId} aria-labelledby={panelId + '-tab-' + active} tabIndex={0}>
			{(paneRoute && !presented.has(paneRoute.stack)
				? <PresentedStacks value={presentedWith(paneRoute.stack)}>{resolve(paneRoute.name, routeProps(paneRoute), paneRoute)}</PresentedStacks>
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
