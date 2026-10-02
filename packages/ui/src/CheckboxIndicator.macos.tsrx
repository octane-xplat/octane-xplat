/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import type { IndicatorProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'

/** CheckboxIndicator — decorative box: check glyph when checked, inset bar
 *  when indeterminate. Mirrors the shared leaf. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>) @{
	const size = props.size ?? 'md'
	const mark = props.state === 'indeterminate'
		? <flexboxlayout className={cx('vx-ind-dash', `vx-ind-dash--${size}`)} />
		: props.state === 'checked'
			? <label className={cx('vx-checkbox-check', `vx-ind-check--${size}`)} text="✓" />
			: null

	const content = props.children != null ? props.children : mark

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-checkbox', 'vx-ind-checkbox', `vx-ind-checkbox--${size}`, props.state !== 'unchecked' && `vx-ind-checkbox--${props.state}`, props.isDisabled && 'vx-ind-checkbox--disabled', props.className)}
		style={props.style}
		alignItems="center"
		justifyContent="center"
	>
		{content}
	</flexboxlayout>
}
