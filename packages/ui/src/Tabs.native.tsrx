/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { cx } from './cx';
import { Icon } from './Icon.native.tsrx';
import { Pressable } from './Pressable.native.tsrx';
import { Text } from './Text.native.tsrx';
import { layoutsForRoute, screenFor, useRoute } from './route.native';
import { RouteHost } from './RouteHost.native';
import type { TabSpec, TabsProps } from './props';

export type { TabSpec } from './props';

function screenParams(route: NonNullable<ReturnType<typeof useRoute>>) {
	const params: Record<string, unknown> = { ...route.params, ...(route.context ?? {}), _stack: route.stack, _pushed: true };
	if (Object.prototype.hasOwnProperty.call(route, 'loaderData')) params.data = route.loaderData;
	if (Object.prototype.hasOwnProperty.call(route, 'loaderError')) params.error = route.loaderError;
	return params;
}

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
	const columns = props.tabs.map(() => '*').join(',');

	<gridlayout rows="auto,*" id={props.id} className={cx(props.className)} style={props.style}>
		<gridlayout row={0} columns={columns} className="vx-tabbar">
			@for (const t of props.tabs; index i; key t.title) {
				<Pressable
					col={i}
					className={cx('vx-tab', active === i ? 'active' : '')}
					onPress={() => { setInternal(i); props.onSelectedIndexChanged?.(i); }}
				>
					@if (t.icon) {
						<Icon name={t.icon} className="vx-tabicon" size={18} />
					}
					<Text>{t.title}</Text>
				</Pressable>
			}
		</gridlayout>
		<gridlayout row={1} className={cx('vx-tabpane', route?.presentation === 'fade' ? 'vx-route--fade' : '')}>
			@if (route && Screen) {
				<RouteHost
					screen={Screen}
					layouts={layoutsForRoute(route.name)}
					params={screenParams(route)}
				/>
			} @else {
				<>{tab?.render()}</>
			}
		</gridlayout>
	</gridlayout>
}
