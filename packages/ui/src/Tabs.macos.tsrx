/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
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

export function Tabs(props: TabsProps) @{
	const [internal, setInternal] = useState(0)
	const active = props.selectedIndex ?? internal
	const tab = props.tabs[active]
	const route = useRoute(tab?.stack ?? 'root')
	const Screen = route ? screenFor(route.name) : undefined

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
			@if (route && Screen) {
				<RouteHost screen={Screen} layouts={layoutsFor(route.name)} params={screenParams(route)} />
			} @else {
				<>{tab?.render()}</>
			}
		</flexboxlayout>
	</flexboxlayout>
}
