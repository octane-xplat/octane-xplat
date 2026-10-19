/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { createContext, useContext, useState } from 'octane'
import type { TabSpec, TabsProps } from './props'
import { cx } from '@octane-xplat/lib'
import { TabList, Tab } from './TabList.macos.tsrx'
import { RouteHost } from './RouteHost.macos.tsrx'
import { errorBoundaryFor, layoutsFor, useRoute, screenFor } from './route.macos'

export type { TabSpec } from './props'

function screenParams(route: NonNullable<ReturnType<typeof useRoute>>) {
	const params: Record<string, unknown> = { ...route.params, ...(route.context ?? {}), _stack: route.stack, _pushed: true }
	if (Object.prototype.hasOwnProperty.call(route, 'loaderData')) {params.data = route.loaderData}
	if (Object.prototype.hasOwnProperty.call(route, 'loaderError')) {params.error = route.loaderError}
	if (route.loaderPending === true) {params.pending = true}
	return params
}

// Stacks already presented by an ancestor Tabs. The AppKit host has no root
// Frame, so a stackless tab pane presents the 'root' stack's top route — but
// a Tabs nested inside a presented screen (e.g. a fixture mounted by that
// very route) must not re-present the same stack, which would recurse until
// the JS stack overflows.
const PresentedStacks: any = createContext(null)

/** Selection identity — `key` is stable across reorders; a keyless tab
 *  falls back to its position. */
const keyFor = (tab: TabSpec | undefined, index: number) => tab?.key ?? String(index)

export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(() => props.defaultSelectedKey ?? keyFor(props.tabs[0], 0))
	const presented: Set<string> = useContext(PresentedStacks) ?? new Set()
	const selectedKey = props.selectedKey ?? (props.selectedIndex != null ? keyFor(props.tabs[props.selectedIndex], props.selectedIndex) : internal)
	const active = props.tabs.findIndex((t, i) => keyFor(t, i) === selectedKey)
	const tab = active >= 0 ? props.tabs[active] : undefined
	const route = useRoute(tab?.stack ?? 'root')
	const presentable = route && !presented.has(route.stack) ? route : null
	const Screen = presentable ? screenFor(presentable.name) : undefined

	<masonview id={props.id} className={cx('vx-tabs', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))}>
		<TabList
			className="vx-tabbar"
			role="tablist"
			layout="fill"
			hasDivider
			value={selectedKey}
			onChange={(key) => { setInternal(key); props.onSelectionChange?.(key); props.onSelectedIndexChanged?.(props.tabs.findIndex((t, i) => keyFor(t, i) === key)) }}
		>
			@for (const item of props.tabs; index i; key item.key ?? item.title) {
				<Tab id={'tab-' + i} value={keyFor(item, i)} label={item.title} icon={item.icon} />
			}
		</TabList>
		<masonview className="vx-tabpane flex-1" style={mergeStyle({flexDirection: "column"}, {display: "flex"})}>
			@if (presentable && Screen) {
				<PresentedStacks value={new Set(presented).add(presentable.stack)}>
					<RouteHost screen={Screen} layouts={layoutsFor(presentable.name)} params={screenParams(presentable)} boundary={errorBoundaryFor(presentable.name)} route={presentable} />
				</PresentedStacks>
			} @else {
				<>{tab?.render()}</>
			}
		</masonview>
	</masonview>
}
