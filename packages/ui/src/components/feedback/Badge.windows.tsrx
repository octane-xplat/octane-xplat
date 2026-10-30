/** @jsxImportSource @octane-xplat/jsx */
import type { View } from '@nativescript/core'
import type { BadgeProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { TextSlot } from '../forms/text-slot'

/** Badge — native text hosts preserve primitive children, including zero. */
export function Badge(props: BadgeProps): unknown @{
	<masonview
		ref={(view: View | null) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-badge', `vx-badge--${props.variant ?? 'neutral'}`, props.className)}
		style={props.style}
	>
		<TextSlot>{props.children ?? props.label}</TextSlot>
	</masonview>
}
