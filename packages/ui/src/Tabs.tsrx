/** @jsxImportSource @nativescript-community/octane */
import { RouteOutlet } from './RouteOutlet.tsrx'
import { routeTabKey, useRouteTabsSelection } from './route-tabs-selection.tsrx'
import { RoutePane } from './RoutePane'
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'
import { TabList, Tab } from './TabList'
import type { TabsProps } from './props'

export type { TabSpec } from './props'

export function Tabs(props: TabsProps): any {
	const selection = useRouteTabsSelection(props)
	const idPrefix = props.id ?? selection.panelId
	return <>
		<masonview id={props.id} className={cx('vx-tabs', props.className)} style={mergeStyle({display: "grid", gridTemplateRows: "auto 1fr"}, props.style)}>
			<TabList className="vx-tabbar" role="tablist" layout="fill" hasDivider value={selection.selectedKey} onChange={selection.select} style={{ gridRow: "1" }}>
				@for (const tab of props.tabs; index i; key routeTabKey(tab, i)) {
					<Tab value={routeTabKey(tab, i)} label={tab.title} icon={tab.icon} panelId={idPrefix + '-panel-' + i} id={idPrefix + '-tab-' + i} />
				}
			</TabList>
			<masonview className="vx-tabpane" style={{ display: "grid", gridRow: "2" }}>
				@for (const tab of props.tabs; index i; key routeTabKey(tab, i)) {
					<RoutePane active={selection.selectedKey === routeTabKey(tab, i)}>
						@if (tab.stack) {
							<RouteOutlet stack={tab.stack}>{tab.render()}</RouteOutlet>
						} @else {
							<>{tab.render()}</>
						}
					</RoutePane>
				}
			</masonview>
		</masonview>
	</>
}
