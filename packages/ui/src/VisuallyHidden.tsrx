/** @jsxImportSource @nativescript-community/octane */
import type { VisuallyHiddenProps } from './props';
import { applyEscapeProps } from './escape-props';

/** VisuallyHidden — a 1dip, fully transparent container that keeps its
 *  subtree in the native accessibility tree (opacity:0 views stay exposed
 *  to TalkBack/VoiceOver, unlike visibility=hidden which drops them on
 *  iOS). For screen-reader labels and live-region announcements. */
export function VisuallyHidden(props: VisuallyHiddenProps) @{
	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		className="vx-visually-hidden"
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.children}
	</flexboxlayout>
}
