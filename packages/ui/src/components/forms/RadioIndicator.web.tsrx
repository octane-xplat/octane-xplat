/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import type { JSX } from 'octane/jsx-runtime'

/** RadioIndicator — decorative circle (20/24px); a filled dot appears when
 *  checked. `aria-hidden`; `children` replaces the dot. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>): JSX.Element @{
	const size = props.size ?? 'md'
	const content =
		props.children != null ? (
			props.children
		) : props.state === 'checked' ? (
			<span className={['vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`]} />
		) : null

	const forwardedRef = useMemo(
		() =>
			refList((e: any) => {
				if (e) {
					applyEscapeProps(e, props)
					applyWebProps(e, props.web)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<span
		id={props.id}
		ref={forwardedRef}
		className={[
			'vx-radio',
			'vx-ind-radio',
			`vx-ind-radio--${size}`,
			props.state === 'checked' ? 'vx-ind-radio--checked' : undefined,
			props.isDisabled ? 'vx-ind-radio--disabled' : undefined,
			props.className,
		]}
		style={props.style}
		aria-hidden="true"
	>
		{content}
	</span>
}
