/** @jsxImportSource @nativescript-community/octane */
import type { RollingTextProps } from './props'
import { useRollingText } from './use-rolling.tsrx'
import { applyEscapeProps } from './escape-props.mobile'
import { layoutChildProps } from './layout-child'

/** Single-line label whose text rolls per unit when `value` changes. The row
 *  is a one-line clip; cells are flex children keyed by survivor identity.
 *  The container carries the whole current value as its accessible name, so
 *  readers never see duplicated outgoing/incoming text. */
export function RollingText(props: RollingTextProps) @{
	const roll = useRollingText(props)

	<masonview id={props.id} testID={props.testID ?? ''} ref={(view: any) => {
			applyEscapeProps(view, props)
			roll.attachRow(view)
		}} {...layoutChildProps(props)} className={['vx-rolling-text', props.className]} style={{display: "flex", ...(props.style)}} flexDirection="row" flexWrap="nowrap" accessible={true} accessibilityRole={'text' as any} accessibilityLabel={roll.label} accessibilityLiveRegion={props.accessibilityLiveRegion as any}>
		@for (const cell of roll.cells; key cell.id) {
			<masonview ref={roll.attachCell(cell.id)} accessible={false} flexShrink={0} style={{display: "flex"}}>
				<label text={cell.unit} maxLines={1} accessible={false} />
			</masonview>
		}
	</masonview>
}
