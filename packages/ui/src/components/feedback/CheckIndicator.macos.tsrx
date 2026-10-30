/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'

/** CheckIndicator — standalone selection mark; nothing when unchecked and
 *  childless, check glyph when checked, `children` in a stable slot. */
export function CheckIndicator(props: IndicatorProps<'singleSelection'>): unknown @{
	const size = props.size ?? 'md'

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	@if (props.children != null) {
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-ind-check-slot', `vx-ind-check-slot--${size}`, props.className)}
			style={mergeStyle(
				{ alignItems: 'center', justifyContent: 'center' },
				mergeStyle({ display: 'flex' }, props.style),
			)}
		>
			{props.children}
		</masonview>
	} @else if (props.state === 'checked') {
		<label
			id={props.id}
			ref={forwardedRef}
			className={cx(
				'vx-ind-check',
				`vx-ind-check--${size}`,
				props.isDisabled && 'vx-ind-check--disabled',
				props.className,
			)}
			style={styleRecord(props.style)}
			text="✓"
		/>
	} @else {
		null
	}
}
