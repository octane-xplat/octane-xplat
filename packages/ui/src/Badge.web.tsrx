import type { BadgeProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Badge — inline label chip. Pure composition; `vx-badge` supplies only the
 *  inline-flex row so apps own all visual styling. */
export function Badge(props: BadgeProps) @{
	<span ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-badge', props.className]} style={props.style}>
		{props.children}
	</span>
}
