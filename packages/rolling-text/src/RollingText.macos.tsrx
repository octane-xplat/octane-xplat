/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { RollingTextProps } from './props'
import { useRollingText } from './use-rolling.tsrx'
import { layoutChildProps } from './layout-child'

/** Single-line label whose text rolls per unit when `value` changes. The row
 *  is a one-line clip; cells are flex children keyed by survivor identity.
 *  The container carries the whole current value as its accessible name, so
 *  readers never see duplicated outgoing/incoming text. */
export function RollingText(props: RollingTextProps) @{
	const roll = useRollingText(props)
	// AppKit stacks do not inherit typography into their NSTextField children.
	const { fontSize, fontFamily, fontWeight, color, ...rowStyle } = props.style ?? {}
	const textStyle = { fontSize, fontFamily, fontWeight, color }

	<masonview
		id={props.id}
		testID={props.testID ?? ''}
		ref={(view: any) => {
			roll.attachRow(view)
		}}
		{...layoutChildProps(
			props,
			mergeStyle({ flexDirection: 'row', flexWrap: 'nowrap' }, { display: 'flex', ...rowStyle }),
		)}
		className={['vx-rolling-text', props.className]}
		accessible={true}
		accessibilityRole={'text' as any}
		accessibilityLabel={roll.label}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		@for (const cell of roll.cells; key cell.id) {
			<masonview
				ref={roll.attachCell(cell.id)}
				accessible={false}
				style={mergeStyle({ flexShrink: 0 }, { display: 'flex' })}
			>
				<label
					text={cell.unit}
					style={textStyle}
					maxLines={1}
					ref={(view: any) => {
						if (view) {
							view.accessibilityElement = false
						}
					}}
				/>
			</masonview>
		}
	</masonview>
}
