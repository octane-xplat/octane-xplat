/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { cx } from '@octane-xplat/lib'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import type { JSX } from 'octane/jsx-runtime'

/** CheckboxIndicator — decorative box: check glyph when checked, inset bar
 *  when indeterminate, 20px (sm) / 24px (md). `aria-hidden` — the owning
 *  checkbox keeps the semantics. `children` replaces the state mark. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>): JSX.Element @{
	const size = props.size ?? 'md'
	// Astryx structure: both marks are always present; CSS shows the check
	// svg when checked and the bar when indeterminate.
	const mark = (
		<>
			<svg viewBox="0 0 10 10" className={cx('vx-ind-checkmark', `vx-ind-checkmark--${size}`)}>
				<path
					d="M8.5 2.5L4 7.5L1.5 5"
					stroke="currentColor"
					strokeWidth="1.5"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<span className={cx('vx-ind-dash', `vx-ind-dash--${size}`)} />
		</>
	)

	const content = props.children != null ? props.children : mark

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
			'vx-checkbox',
			'vx-ind-checkbox',
			`vx-ind-checkbox--${size}`,
			props.state !== 'unchecked' ? `vx-ind-checkbox--${props.state}` : undefined,
			props.isDisabled ? 'vx-ind-checkbox--disabled' : undefined,
			props.className,
		]}
		style={props.style}
		aria-hidden="true"
	>
		{content}
	</span>
}
