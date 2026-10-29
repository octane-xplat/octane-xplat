/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
// Registers the `svgview` element on mobile (svg.mobile.ts side effect);
// resolves to the re-export-only svg.ts on web.
import '../media/svg'

/** Astryx's check path (0 0 10 10 viewBox) drawn by svgview — the same
 *  geometry the web leaf renders. The root `color` attr feeds
 *  `currentColor`; it matches --color-onprimary (#fff) in both bundled
 *  themes — a custom theme that recolors it swaps the visual through
 *  `registerIndicator`. */
const CHECK_MARKUP =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" color="#fff"><path d="M8.5 2.5L4 7.5L1.5 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/** CheckboxIndicator — decorative box for a checkbox: 20dip (sm) / 24dip
 *  (md) square, check glyph when checked, an inset bar when indeterminate.
 *  Renderable `children` replace the state mark (busy spinners). The owning
 *  control keeps role/focus/state — this draws the picture only. */
export function CheckboxIndicator(props: IndicatorProps<'multiSelection'>) @{
	const size = props.size ?? 'md'
	const mark =
		props.state === 'indeterminate' ? (
			<masonview
				className={cx('vx-ind-dash', `vx-ind-dash--${size}`)}
				style={{ display: 'flex' }}
			/>
		) : props.state === 'checked' ? (
			<svgview
				className={cx('vx-ind-checkmark', `vx-ind-checkmark--${size}`)}
				src={CHECK_MARKUP}
				stretch="aspectFit"
			/>
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
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{content}
	</masonview>
}
