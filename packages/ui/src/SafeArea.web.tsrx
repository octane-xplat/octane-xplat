/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext } from 'octane'
import { styleRecord } from './style-merge'
import type { SafeAreaProps } from './props'
import { useSafeAreaInsets } from './safeAreaInsets.web.tsrx'
import {
	ConsumedInsetsContext,
	ConsumedInsetsProvider,
	consumeInsets,
	resolveSafeAreaEdges,
} from './inset-consumption'

function applyWebProps(node: any, bag?: Record<string, any>) {
	if (!node || !bag) {
		return
	}

	for (const [key, value] of Object.entries(bag)) {
		if (key.includes('-')) {
			node.setAttribute(key, String(value))
		} else {
			node[key] = value
		}
	}
}

export function SafeArea(props: SafeAreaProps) @{
	const measured = useSafeAreaInsets()
	const ancestor = useContext(ConsumedInsetsContext)
	const edges = resolveSafeAreaEdges(props.edges, props.ignoreSafeArea)
	const { applied, provided } = consumeInsets(measured, ancestor, edges)

	<div
		id={props.id}
		ref={(node: any) => applyWebProps(node, props.web)}
		className={['vx-safe-area', props.className]}
		style={{
			...styleRecord(props.style),
			paddingTop: applied.top,
			paddingRight: applied.right,
			paddingBottom: applied.bottom,
			paddingLeft: applied.left,
		}}
	>
		<ConsumedInsetsProvider value={provided}>{props.children}</ConsumedInsetsProvider>
	</div>
}
