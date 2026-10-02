/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import type { SectionProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'
import { spacingPx } from './stack-layout'

/** Section — banded container with surface/transparent/muted background.
 *  Single wrapper on AppKit (the web leaf's container-padding escape is a
 *  CSS-var mechanism with no AppKit analog). */
export function Section(props: SectionProps) @{
	const variant = props.variant ?? 'section'
	const dividers = new Set(props.dividers ?? [])
	const padding = spacingPx(props.padding) ?? 16

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={cx(
			'vx-section',
			`vx-section--${variant}`,
			dividers.has('top') && 'vx-section--divider-top',
			dividers.has('bottom') && 'vx-section--divider-bottom',
			dividers.has('start') && 'vx-section--divider-start',
			dividers.has('end') && 'vx-section--divider-end',
			props.className,
		)}
		style={{
			paddingLeft: spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? padding,
			paddingRight: spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? padding,
			paddingTop: spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? padding,
			paddingBottom: spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? padding,
			...(props.width != null ? { width: props.width } : {}),
			...(props.height != null ? { height: props.height } : {}),
			...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
			...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
			...props.style,
		}}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
	>
		{props.children}
	</flexboxlayout>
}
