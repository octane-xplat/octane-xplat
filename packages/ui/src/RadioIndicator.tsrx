/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { IndicatorProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

/** RadioIndicator — decorative circle (20/24dip); a filled dot appears
 *  when checked. `children` replaces the dot (busy spinners). Decorative
 *  only — the owning control keeps role/focus/state. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md';
	const content = props.children != null
		? props.children
		: props.state === 'checked'
			? <flexboxlayout className={cx('vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`)} />
			: null;

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={cx(
			'vx-radio', 'vx-ind-radio', `vx-ind-radio--${size}`,
			props.state === 'checked' && 'vx-ind-radio--checked',
			props.isDisabled && 'vx-ind-radio--disabled',
			props.className,
		)}
		style={props.style}
		alignItems="center"
		justifyContent="center"
	>
		{content}
	</flexboxlayout>
}
