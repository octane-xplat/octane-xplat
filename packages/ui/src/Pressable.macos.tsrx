/** @jsxImportSource @xplat/macos/renderer */
import type { PressableProps } from './props'
import { cx } from './cx'

export function Pressable(props: PressableProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		gap={props.gap}
		className={cx('vx-pressable', props.className)}
		style={props.style}
		onTap={props.disabled ? undefined : props.onPress}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : undefined)}
	>
		{props.children}
	</flexboxlayout>
}
