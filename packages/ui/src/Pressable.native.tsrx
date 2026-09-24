/** @jsxImportSource @nativescript-community/octane */
import type { PressableProps } from "./props";
import { cx } from "./cx";
/** flexboxlayout, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Column flex matches View's shape (and the web div);
 *  tap/longPress are gesture events, they attach to any view. */
export function Pressable(props: PressableProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-pressable', props.className)}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole as any}
		onTap={props.disabled ? undefined : props.onPress}
		onLongPress={props.disabled ? undefined : props.onLongPress}
	>
		{props.children}
	</flexboxlayout>
}
