/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo, useContext } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { FormLayoutProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { FormLayoutContext, FormLayoutProvider } from './form-layout-context'
import type { JSX } from 'octane/jsx-runtime'

/** FormLayout — arranges fields: 'vertical' column (16px gaps),
 *  'horizontal' equal-width row, 'horizontal-labels' a two-column grid
 *  (`auto 1fr`) where each field's label sits beside its control —
 *  `Field` renders `display:contents` under this mode so its label/body
 *  become grid items; collapses to a column under 480px (CSS). */
export function FormLayout(props: FormLayoutProps): JSX.Element @{
	const parent = useContext(FormLayoutContext)
	const direction = props.direction ?? 'vertical'
	const defaultOptionality = props.defaultOptionality ?? parent.defaultOptionality
	const value = { direction, defaultOptionality }

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

	<FormLayoutProvider value={value}>
		<div
			id={props.id}
			ref={forwardedRef}
			className={['vx-formlayout', `vx-formlayout--${direction}`, props.className]}
			style={props.style}
			role={props.accessibilityRole}
			aria-label={props.accessibilityLabel}
			aria-hidden={props.accessible === false ? true : undefined}
			aria-description={props.accessibilityHint}
			aria-valuetext={props.accessibilityValue}
			aria-disabled={props.accessibilityState?.disabled}
			aria-selected={props.accessibilityState?.selected}
			aria-checked={props.accessibilityState?.checked}
			aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		>
			{props.children}
		</div>
	</FormLayoutProvider>
}
