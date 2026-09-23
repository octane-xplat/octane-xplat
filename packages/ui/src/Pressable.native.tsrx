/** @jsxImportSource @nativescript-community/octane */
import type { PressableProps } from "./props";
export function Pressable(props: PressableProps) @{
	<contentview
		id={props.id}
		className={props.className}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole as any}
		onTap={props.disabled ? undefined : props.onPress}
		onLongPress={props.disabled ? undefined : props.onLongPress}
	>
		{props.children}
	</contentview>
}
