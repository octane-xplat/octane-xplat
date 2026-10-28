/** @jsxImportSource @octane-xplat/jsx */
import { RouteOutlet } from './RouteOutlet.macos.tsrx'
import { routeTabKey, useRouteTabsSelection } from './route-tabs-selection.tsrx'
import { RoutePane } from './RoutePane'
import { mergeStyle } from './style-merge'
import { cx } from '@octane-xplat/lib'
import { TabList, Tab } from './TabList.macos.tsrx'
import type { TabsProps } from './props'

export type { TabSpec } from './props'

export function Tabs(props: TabsProps): any {
	const selection = useRouteTabsSelection(props)
	const idPrefix = props.id ?? selection.panelId
	return (
		<>
			<masonview
				id={props.id}
				className={cx('vx-tabs', props.className)}
				style={mergeStyle({ display: 'flex', flexDirection: 'column' }, props.style)}
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
					<masonview
						id={idPrefix + '-panel-' + i}
						className="vx-tabpane"
						accessibilityRole="tabpanel"
						style={{
							display: selection.selectedKey === routeTabKey(tab, i) ? 'flex' : 'none',
							flexDirection: 'column',
							flexGrow: 1,
						}}
					>
						<RoutePane active={selection.selectedKey === routeTabKey(tab, i)}>
							@if (tab.stack) {
								<RouteOutlet stack={tab.stack}>{tab.render()}</RouteOutlet>
							} @else {
								<>{tab.render()}</>
							}
						</RoutePane>
					</masonview>
				}
			</masonview>
		</>
	)
}
