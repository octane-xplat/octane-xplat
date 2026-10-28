/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { PressableProps } from './props'
import { usePan } from './pan.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from './layout-child'

export function Pressable(props: PressableProps) @{
	<masonview
		ref={props.ref}
		{...layoutChildProps(
			props,
			mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style)),
		)}
		id={props.id}
		className={cx('vx-pressable', props.className)}
		disabled={props.disabled}
		onPan={usePan(props.disabled ? undefined : props.onPan)}
		onSwipe={props.disabled ? undefined : props.onSwipe}
		onLongPress={props.disabled ? undefined : props.onLongPress}
		onDoubleTap={props.disabled ? undefined : props.onDoublePress}
		onTouch={
			props.disabled
				? undefined
				: (e: any) => {
						if (e.action === 'down') {
							props.onPressIn?.()
						} else if (e.action === 'up' || e.action === 'cancel') {
							props.onPressOut?.()
						}
					}
		}
		onTap={props.disabled ? undefined : props.onPress}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={{
			...props.accessibilityState,
			disabled: props.disabled || props.accessibilityState?.disabled,
		}}
		accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : undefined)}
	>
		{props.children}
	</masonview>
}
