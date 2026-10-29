/** @jsxImportSource @octane-xplat/jsx/dom */
import { useLayoutEffect, useSyncExternalStore } from 'octane'
import { useRouteOutletScope } from '../../routing/route-outlet-scope.tsrx'
import { styleRecord } from '../../internal/layout/style-merge'
import type { BrowserRouterHost } from '../../routing/browser-router-host.web'
import { defaultRouterRuntime } from '../../routing/default-router.web'
import { RouteOutlet } from '../../routing/RouteOutlet.web.tsrx'
import { routeTabKey, useRouteTabsSelection } from '../../routing/route-tabs-selection.tsrx'
import { TabList, Tab } from './TabList.web.tsrx'
import type { TabSpec, TabsProps } from '../../props'

export type { TabSpec } from '../../props'

function TabRouteSelection(props: TabsProps & { select(key: string): void }) {
	const { host } = useRouteOutletScope(undefined, defaultRouterRuntime)
	const platform = host as BrowserRouterHost
	const snapshot = useSyncExternalStore(
		platform.views.subscribe,
		platform.views.getSnapshot,
		platform.views.getSnapshot,
	)

	// An incoming browser entry selects its conceptual pane. Explicit controlled
	// selection remains owned by the caller; tab clicks themselves are UI state.
	useLayoutEffect(() => {
		const flow = snapshot.main?.flow
		if (!flow) {
			return
		}

		const index = props.tabs.findIndex((tab) => tab.stack === flow)
		if (index >= 0 && props.selectedKey === undefined && props.selectedIndex === undefined) {
			props.select(routeTabKey(props.tabs[index], index))
		}
	}, [snapshot.main?.id])

	return null
}

export function Tabs(props: TabsProps): any {
	const selection = useRouteTabsSelection(props)
	const idPrefix = props.id ?? selection.panelId
	return (
		<>
			{props.tabs.some((tab) => !!tab.stack) ? (
				<TabRouteSelection {...props} select={selection.select} />
			) : null}
			<div
				id={props.id}
				className={['vx-tabs', props.className]}
				style={{
					...(styleRecord(props.style)?.height != null ? { flex: 'none' } : {}),
					...styleRecord(props.style),
				}}
			>
				<TabList
					className="vx-tabbar"
					role="tablist"
					layout="fill"
					hasDivider
					value={selection.selectedKey}
					onChange={selection.select}
				>
					@for (const tab of props.tabs; index i; key routeTabKey(tab, i)) {
						<Tab
							value={routeTabKey(tab, i)}
							label={tab.title}
							icon={tab.icon}
							panelId={idPrefix + '-panel-' + i}
							id={idPrefix + '-tab-' + i}
						/>
					}
				</TabList>
				@for (const tab of props.tabs; index i; key routeTabKey(tab, i)) {
					<div
						className="vx-tabpane"
						role="tabpanel"
						id={idPrefix + '-panel-' + i}
						aria-labelledby={idPrefix + '-tab-' + i}
						hidden={selection.selectedKey !== routeTabKey(tab, i)}
						tabIndex={selection.selectedKey === routeTabKey(tab, i) ? 0 : -1}
						style={{
							display: selection.selectedKey === routeTabKey(tab, i) ? undefined : 'none',
						}}
					>
						@if (tab.stack) {
							<RouteOutlet stack={tab.stack}>{tab.render()}</RouteOutlet>
						} @else {
							<>{tab.render()}</>
						}
					</div>
				}
			</div>
		</>
	)
}
