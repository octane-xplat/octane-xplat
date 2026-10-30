/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import type { JSX } from 'octane/jsx-runtime'

/** CheckIndicator — standalone selection mark. Nothing when unchecked and
 *  childless; a check glyph when checked; `children` replace the glyph
 *  inside a stable slot. `aria-hidden`. */
export function CheckIndicator(
	props: IndicatorProps<'singleSelection'>,
): JSX.Element | null @{
	const size = props.size ?? 'md'

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

	@if (props.children != null) {
		<span
			id={props.id}
			ref={forwardedRef}
			className={['vx-ind-check-slot', `vx-ind-check-slot--${size}`, props.className]}
			style={props.style}
			aria-hidden="true"
		>
			{props.children}
		</span>
	} @else if (props.state === 'checked') {
		<span
			id={props.id}
			ref={forwardedRef}
			className={[
				'vx-ind-check',
				`vx-ind-check--${size}`,
				props.isDisabled ? 'vx-ind-check--disabled' : undefined,
				props.className,
			]}
			style={props.style}
			aria-hidden="true"
		>
			{'✓'}
		</span>
	} @else {
		null
	}
}
