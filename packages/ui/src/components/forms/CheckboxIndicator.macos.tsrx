/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'

/** CheckboxIndicator — decorative box: check glyph when checked, inset bar
 *  when indeterminate. Mirrors the shared leaf. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>) @{
	const size = props.size ?? 'md'
	const mark =
		props.state === 'indeterminate' ? (
			<masonview
				className={cx('vx-ind-dash', `vx-ind-dash--${size}`)}
				style={{ display: 'flex' }}
			/>
		) : props.state === 'checked' ? (
			<label className={cx('vx-checkbox-check', `vx-ind-check--${size}`)} text="✓" />
		) : null

	const content = props.children != null ? props.children : mark

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx(
			'vx-checkbox',
			'vx-ind-checkbox',
			`vx-ind-checkbox--${size}`,
			props.state !== 'unchecked' && `vx-ind-checkbox--${props.state}`,
			props.isDisabled && 'vx-ind-checkbox--disabled',
			props.className,
		)}
		style={mergeStyle(
			{ alignItems: 'center', justifyContent: 'center' },
			mergeStyle({ display: 'flex' }, props.style),
		)}
	>
		{content}
	</masonview>
}
