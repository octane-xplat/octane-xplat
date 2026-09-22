/** @jsxImportSource @nativescript-community/octane */
export function Pressable(props: {
  className?: any;
  style?: any;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  children?: any;
}) @{
	<contentview
		className={props.className}
		style={props.style}
		onTap={props.disabled ? undefined : props.onPress}
		onLongPress={props.disabled ? undefined : props.onLongPress}
	>
		{props.children}
	</contentview>
}
