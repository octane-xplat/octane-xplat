/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo, useContext } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { FormLayoutProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { FormLayoutContext, FormLayoutProvider } from './form-layout-context'

/** FormLayout — 'vertical' is a column. Mason auto-places 'horizontal'
 *  children into equal implicit columns; keep one host as direction changes
 *  so field owners and editors survive. 'horizontal-labels' keeps the
 *  column host — each `Field` reads the context and renders its own
 *  label-beside-control row (per-field label width; the web grid's shared
 *  label column has no native analog). */
export function FormLayout(props: FormLayoutProps): unknown @{
	const parent = useContext(FormLayoutContext)
	const direction = props.direction ?? 'vertical'
	const defaultOptionality = props.defaultOptionality ?? parent.defaultOptionality
	const value = { direction, defaultOptionality }

	const forwardedRef = useMemo(
		() =>
			refList((view: any) => {
				if (view) applyEscapeProps(view, props)
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<FormLayoutProvider value={value}>
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx('vx-formlayout', `vx-formlayout--${direction}`, props.className)}
			style={mergeStyle(
				direction === 'horizontal'
					? { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr' }
					: { display: 'flex' },
				props.style,
			)}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState)}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			{props.children}
		</masonview>
	</FormLayoutProvider>
}
