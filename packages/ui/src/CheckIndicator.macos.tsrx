/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { IndicatorProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

/** CheckIndicator — standalone selection mark; nothing when unchecked and
 *  childless, check glyph when checked, `children` in a stable slot. */
export function CheckIndicator(props: IndicatorProps<'singleSelection'>) @{
	const size = props.size ?? 'md'

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	@if (props.children != null) {
		<masonview id={props.id} ref={forwardedRef} className={cx('vx-ind-check-slot', `vx-ind-check-slot--${size}`, props.className)} style={mergeStyle({display: "flex"}, props.style)} alignItems="center" justifyContent="center">
			{props.children}
		</masonview>
	} @else if (props.state === 'checked') {
		<label
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-ind-check', `vx-ind-check--${size}`, props.isDisabled && 'vx-ind-check--disabled', props.className)}
			style={props.style as any}
			text="✓"
		/>
	} @else {
		null
	}
}
