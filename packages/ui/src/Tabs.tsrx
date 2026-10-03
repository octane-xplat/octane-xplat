/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { cx } from './cx';
import { TabList, Tab } from './TabList';
import { errorBoundaryFor, layoutsForRoute, screenFor, useRoute } from './route';
import { RouteHost, screenParamsFor } from './route-host';
import type { TabSpec, TabsProps } from './props';

export type { TabSpec } from './props';

/** Self-drawn tab shell — a fixed Pressable row plus a single swapped pane,
 *  identical on every target (the same shape as the web leaf). Route
 *  history for `stack` panes lives in the route store, so switching tabs
 *  keeps each stack's entries; pushed screens render through RouteHost.
 *  The platform tab bar (UITabBar/BottomNavigationView — real UITabBarItem
 *  chrome, per-pane Frames) lives in `ui/ios` + `ui/android`.
 *  `tabs` is identity-stable (module const preferred). */
export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(0);
	const active = props.selectedIndex ?? internal;
	const tab = props.tabs[active];
	const route = useRoute(tab?.stack ?? '');
	const Screen = route ? screenFor(route.name) : undefined;

	<gridlayout rows="auto,*" id={props.id} className={cx(props.className)} style={props.style}>
		<TabList
			row={0}
			className="vx-tabbar"
			role="tablist"
			layout="fill"
			hasDivider
			value={String(active)}
			onChange={(v) => { const i = Number(v); setInternal(i); props.onSelectedIndexChanged?.(i); }}
		>
			@for (const t of props.tabs; index i; key t.title) {
				<Tab value={String(i)} label={t.title} icon={t.icon} />
			}
		</TabList>
		<gridlayout row={1} className={cx('vx-tabpane', route?.presentation === 'fade' ? 'vx-route--fade' : '')}>
			@if (route && Screen) {
				<RouteHost
					screen={Screen}
					layouts={layoutsForRoute(route.name)}
					params={screenParamsFor(route)}
					boundary={errorBoundaryFor(route.name)}
					route={route}
				/>
			} @else {
				<>{tab?.render()}</>
			}
		</gridlayout>
	</gridlayout>
}
