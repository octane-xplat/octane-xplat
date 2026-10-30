/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'

/** RadioIndicator — decorative circle + filled dot when checked. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>): unknown @{
	const size = props.size ?? 'md'
	const content =
		props.children != null ? (
			props.children
		) : props.state === 'checked' ? (
			<masonview
				className={cx('vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`)}
				style={{ display: 'flex' }}
			/>
		) : null

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
			'vx-radio',
			'vx-ind-radio',
			`vx-ind-radio--${size}`,
			props.state === 'checked' && 'vx-ind-radio--checked',
			props.isDisabled && 'vx-ind-radio--disabled',
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
