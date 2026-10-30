/** @jsxImportSource @octane-xplat/jsx/dom */
import type { BadgeProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import type { JSX } from 'octane/jsx-runtime'

/** Badge — inline label chip (Astryx `Badge`). `label`/`variant` paint the
 *  pill; `vx-badge--{variant}` class hooks own the palette. */
export function Badge(props: BadgeProps): JSX.Element @{
	<span
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-badge', `vx-badge--${props.variant ?? 'neutral'}`, props.className]}
		style={props.style}
	>
		{props.children ?? props.label}
	</span>
}
