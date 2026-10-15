/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane';
import type { SafeAreaProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';
import { useSafeAreaInsets } from './safeAreaInsets';
import {
	ConsumedInsetsContext,
	ConsumedInsetsProvider,
	consumeInsets,
	resolveSafeAreaEdges,
} from './inset-consumption';

/**
 * Insets content away from notches/system bars by consuming the given edges. Import from `@octane-xplat/ui`.
 *
 * @see SafeAreaProps, useSafeAreaInsets.
 */
export function SafeArea(props: SafeAreaProps) @{
	const measured = useSafeAreaInsets();
	const ancestor = useContext(ConsumedInsetsContext);
	const edges = resolveSafeAreaEdges(props.edges, props.ignoreSafeArea);
	const { applied, provided } = consumeInsets(measured, ancestor, edges);

	<flexboxlayout
		id={props.id}
		ref={(host: any) => applyEscapeProps(host, props)}
		className={cx('vx-safe-area', props.className)}
		style={{ ...(props.style as any), paddingTop: applied.top, paddingRight: applied.right, paddingBottom: applied.bottom, paddingLeft: applied.left }}
	>
		<ConsumedInsetsProvider value={provided}>{props.children}</ConsumedInsetsProvider>
	</flexboxlayout>
}
