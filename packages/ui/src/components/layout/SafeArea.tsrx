/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useContext } from 'octane'
import type { SafeAreaProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { useSafeAreaInsets } from './safeAreaInsets'
import {
	ConsumedInsetsContext,
	ConsumedInsetsProvider,
	consumeInsets,
	resolveSafeAreaEdges,
} from './inset-consumption'

/**
 * Insets content away from notches/system bars by consuming the given edges. Import from `@octane-xplat/ui`.
 *
 * @see SafeAreaProps, useSafeAreaInsets.
 */
export function SafeArea(props: SafeAreaProps): unknown @{
	const measured = useSafeAreaInsets()
	const ancestor = useContext(ConsumedInsetsContext)
	const edges = resolveSafeAreaEdges(props.edges, props.ignoreSafeArea)
	const { applied, provided } = consumeInsets(measured, ancestor, edges)

	<masonview
		id={props.id}
		ref={(host: any) => applyEscapeProps(host, props)}
		className={cx('vx-safe-area', props.className)}
		style={mergeStyle(
			{ display: 'flex' },
			{
				...styleRecord(props.style),
				paddingTop: applied.top,
				paddingRight: applied.right,
				paddingBottom: applied.bottom,
				paddingLeft: applied.left,
			},
		)}
	>
		<ConsumedInsetsProvider value={provided}>{props.children}</ConsumedInsetsProvider>
	</masonview>
}
