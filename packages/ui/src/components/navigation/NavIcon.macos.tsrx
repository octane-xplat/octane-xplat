/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { NavIconProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { Icon } from '../media/Icon.macos.tsrx'

/** Circular icon container for navigation headers. Display-only. */
export function NavIcon(props: NavIconProps) @{
	<masonview
		id={props.id}
		className={cx('vx-navicon', props.className)}
		style={mergeStyle(
			{ justifyContent: 'center', alignItems: 'center' },
			mergeStyle({ display: 'flex' }, props.style),
		)}
	>
		{typeof props.icon === 'string' ? <Icon name={props.icon} size={16} /> : props.icon}
	</masonview>
}
