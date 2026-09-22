/** @jsxImportSource @nativescript-community/octane */
export function Pressable(props: {
  className?: any;
  style?: any;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  children?: any;
  id?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}) @{
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
