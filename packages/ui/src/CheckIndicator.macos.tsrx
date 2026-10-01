/** @jsxImportSource @xplat/macos/renderer */
import type { IndicatorProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'

/** CheckIndicator — standalone selection mark; nothing when unchecked and
 *  childless, check glyph when checked, `children` in a stable slot. */
export function CheckIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md'

	@if (props.children != null) {
		<flexboxlayout
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			className={cx('vx-ind-check-slot', `vx-ind-check-slot--${size}`, props.className)}
			style={props.style}
			alignItems="center"
			justifyContent="center"
		>
			{props.children}
		</flexboxlayout>
	} @else if (props.state === 'checked') {
		<label
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			className={cx('vx-ind-check', `vx-ind-check--${size}`, props.isDisabled && 'vx-ind-check--disabled', props.className)}
			style={props.style}
			text="✓"
		/>
	} @else {
		null
	}
}
