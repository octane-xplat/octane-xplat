/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { IndicatorProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

/** CheckIndicator — the standalone selection mark (listbox options, menu
 *  items). Renders nothing when `state="unchecked"` and no `children` are
 *  given; a check glyph when checked; `children` replace the glyph (e.g. a
 *  spinner) inside a slot that keeps the layout stable. */
export function CheckIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md';

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	@if (props.children != null) {
		<flexboxlayout
			id={props.id}
			ref={forwardedRef}
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
			ref={forwardedRef}
			className={cx('vx-ind-check', `vx-ind-check--${size}`, props.isDisabled && 'vx-ind-check--disabled', props.className)}
			style={props.style}
			text="✓"
		/>
	} @else {
		null
	}
}
