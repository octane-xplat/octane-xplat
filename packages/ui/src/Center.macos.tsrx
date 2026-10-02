/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import type { CenterProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'
import { spacingPx } from './stack-layout'

/** Center — row-direction flex centering on main/cross/both axes.
 *  `isInline` is inert on AppKit (containers are always block-level). */
export function Center(props: CenterProps) @{
	const axis = props.axis ?? 'both'
	const pad = spacingPx(props.padding)

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		flexDirection="row"
		justifyContent={(axis !== 'vertical' ? 'center' : undefined) as any}
		alignItems={(axis !== 'horizontal' ? 'center' : undefined) as any}
		className={cx('vx-center', props.className)}
		style={{
			...(spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? pad) !== undefined ? { paddingLeft: (spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? pad) } : {},
			...(spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? pad) !== undefined ? { paddingRight: (spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? pad) } : {},
			...(spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? pad) !== undefined ? { paddingTop: (spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? pad) } : {},
			...(spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? pad) !== undefined ? { paddingBottom: (spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? pad) } : {},
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
