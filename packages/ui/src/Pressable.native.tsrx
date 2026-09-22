export function Pressable(props: {
  className?: unknown;
  style?: unknown;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  children?: unknown;
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
