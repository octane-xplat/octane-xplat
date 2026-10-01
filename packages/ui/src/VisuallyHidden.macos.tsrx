/** @jsxImportSource @xplat/macos/renderer */
import type { VisuallyHiddenProps } from './props'
import { applyEscapeProps } from './escape-props'

/** VisuallyHidden — 1pt opacity-0 container; keeps content in the a11y
 *  tree while rendering invisible (AppKit hidden views drop from
 *  VoiceOver; transparent ones stay). */
export function VisuallyHidden(props: VisuallyHiddenProps) @{
	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		className="vx-visually-hidden"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
	>
		{props.children}
	</flexboxlayout>
}
