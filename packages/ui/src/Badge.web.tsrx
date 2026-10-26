import type { BadgeProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Badge — inline label chip (Astryx `Badge`). `label`/`variant` paint the
 *  pill; `vx-badge--{variant}` class hooks own the palette. */
export function Badge(props: BadgeProps) @{
	<span ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-badge', `vx-badge--${props.variant ?? 'neutral'}`, props.className]} style={props.style}>
		{props.children ?? props.label}
	</span>
}
