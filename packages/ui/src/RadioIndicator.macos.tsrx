/** @jsxImportSource @xplat/macos/renderer */
import type { IndicatorProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'

/** RadioIndicator — decorative circle + filled dot when checked. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md'
	const content = props.children != null
		? props.children
		: props.state === 'checked'
			? <flexboxlayout className={cx('vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`)} />
			: null

	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		className={cx('vx-radio', 'vx-ind-radio', `vx-ind-radio--${size}`, props.state === 'checked' && 'vx-ind-radio--checked', props.isDisabled && 'vx-ind-radio--disabled', props.className)}
		style={props.style}
		alignItems="center"
		justifyContent="center"
	>
		{content}
	</flexboxlayout>
}
