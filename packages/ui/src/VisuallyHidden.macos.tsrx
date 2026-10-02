/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import type { VisuallyHiddenProps } from './props'
import { applyEscapeProps } from './escape-props'

/** VisuallyHidden — 1pt opacity-0 container; keeps content in the a11y
 *  tree while rendering invisible (AppKit hidden views drop from
 *  VoiceOver; transparent ones stay). */
export function VisuallyHidden(props: VisuallyHiddenProps) @{
	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className="vx-visually-hidden"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
	>
		{props.children}
	</flexboxlayout>
}
