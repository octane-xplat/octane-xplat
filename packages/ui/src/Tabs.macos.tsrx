/** @jsxImportSource @xplat/macos/renderer */
import { createContext, useContext, useState } from 'octane'
import type { TabsProps } from './props'
import { cx } from './cx'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { RouteHost } from './RouteHost.macos.tsrx'
import { layoutsFor, useRoute, screenFor } from './route.macos'

function screenParams(route: NonNullable<ReturnType<typeof useRoute>>) {
	const params: Record<string, unknown> = { ...route.params, ...(route.context ?? {}), _stack: route.stack, _pushed: true }
	if (Object.prototype.hasOwnProperty.call(route, 'loaderData')) {params.data = route.loaderData}
	if (Object.prototype.hasOwnProperty.call(route, 'loaderError')) {params.error = route.loaderError}
	return params
}

// Stacks already presented by an ancestor Tabs. The AppKit host has no root
// Frame, so a stackless tab pane presents the 'root' stack's top route — but
// a Tabs nested inside a presented screen (e.g. a fixture mounted by that
// very route) must not re-present the same stack, which would recurse until
// the JS stack overflows.
const PresentedStacks: any = createContext(null)

export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(0)
	const presented: Set<string> = useContext(PresentedStacks) ?? new Set()
	const active = props.selectedIndex ?? internal
	const tab = props.tabs[active]
	const route = useRoute(tab?.stack ?? 'root')
	const presentable = route && !presented.has(route.stack) ? route : null
	const Screen = presentable ? screenFor(presentable.name) : undefined

	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-tabs', props.className)}
		style={props.style}
	>
		<flexboxlayout flexDirection="row" className="vx-tabbar">
			@for (const item of props.tabs; index i; key item.title) {
				<Pressable
					id={'tab-' + i}
					className={cx('vx-tab', active === i ? 'active' : '')}
					onPress={() => { setInternal(i); props.onSelectedIndexChanged?.(i); }}
				>
					<Text>{item.title}</Text>
				</Pressable>
			}
		</flexboxlayout>
		<flexboxlayout flexDirection="column" className="vx-tabpane flex-1">
			@if (presentable && Screen) {
				<PresentedStacks value={new Set(presented).add(presentable.stack)}>
					<RouteHost screen={Screen} layouts={layoutsFor(presentable.name)} params={screenParams(presentable)} />
				</PresentedStacks>
			} @else {
				<>{tab?.render()}</>
			}
		</flexboxlayout>
	</flexboxlayout>
}
