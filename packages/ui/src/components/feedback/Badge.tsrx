/** @jsxImportSource @octane-xplat/jsx */
import type { BadgeProps } from '../../props'
import { cx } from '@octane-xplat/lib'

/** Badge — inline label chip (Astryx). Native leaf renders the same
 *  `vx-badge--{variant}` class hooks; label text is a span child. */
export function Badge(props: BadgeProps) @{
	<masonview
		id={props.id}
		className={cx('vx-badge', `vx-badge--${props.variant ?? 'neutral'}`, props.className)}
		style={props.style}
	>
		{typeof (props.children ?? props.label) === 'string' || typeof props.label === 'number' ? (
			<label
				text={typeof props.children === 'string' ? props.children : String(props.label ?? '')}
			/>
		) : (
			props.children
		)}
	</masonview>
}
