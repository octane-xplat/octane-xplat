/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import type { IndicatorProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

/** CheckboxIndicator — decorative box for a checkbox: 20dip (sm) / 24dip
 *  (md) square, check glyph when checked, an inset bar when indeterminate.
 *  Renderable `children` replace the state mark (busy spinners). The owning
 *  control keeps role/focus/state — this draws the picture only. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>) @{
	const size = props.size ?? 'md';
	const mark = props.state === 'indeterminate'
		? <flexboxlayout className={cx('vx-ind-dash', `vx-ind-dash--${size}`)} />
		: props.state === 'checked'
			? <label className={cx('vx-checkbox-check', `vx-ind-check--${size}`)} text="✓" />
			: null;

	const content = props.children != null ? props.children : mark;

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={cx(
			'vx-checkbox', 'vx-ind-checkbox', `vx-ind-checkbox--${size}`,
			props.state !== 'unchecked' && `vx-ind-checkbox--${props.state}`,
			props.isDisabled && 'vx-ind-checkbox--disabled',
			props.className,
		)}
		style={props.style}
		alignItems="center"
		justifyContent="center"
	>
		{content}
	</flexboxlayout>
}
