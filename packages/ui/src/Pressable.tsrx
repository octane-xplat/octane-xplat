/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { PressableProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { layoutChildProps } from './layout-child'
import { usePan } from './pan'
/** masonview, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Column flex matches View's shape (and the web div);
 *  tap/longPress are gesture events, they attach to any view. */
export function Pressable(props: PressableProps) @{
	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		ref={forwardedRef}
		id={props.id}
		testID={props.testID ?? ''}
		{...layoutChildProps(
			props,
			mergeStyle(
				{ display: 'flex' },
				{
					...styleRecord(props.style),
					...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}),
				},
			),
		)}
		className={cx('vx-pressable', props.className)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState({
			...props.accessibilityState,
			disabled: props.disabled || props.accessibilityState?.disabled,
		})}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
		onPan={usePan(props.disabled ? undefined : props.onPan)}
		onSwipe={props.disabled ? undefined : props.onSwipe}
		onTap={props.disabled ? undefined : props.onPress}
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
	>
		{props.children}
	</masonview>
}
