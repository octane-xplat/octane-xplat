/** @jsxImportSource @xplat/macos/renderer */
import type { PressableProps } from './props'
import { cx } from './cx'
import { layoutChildProps } from './layout-child'

export function Pressable(props: PressableProps) @{
	<flexboxlayout
		{...layoutChildProps(props)}
		id={props.id}
		flexDirection="column"
		className={cx('vx-pressable', props.className)}
		style={props.style}
		onTap={props.disabled ? undefined : props.onPress}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : undefined)}
	>
		{props.children}
	</flexboxlayout>
}
