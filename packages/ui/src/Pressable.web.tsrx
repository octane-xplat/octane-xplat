export function Pressable(props: {
  className?: any;
  style?: any;
  disabled?: boolean;
  onPress?: () => void;
  children?: any;
}) @{
	<div
		className={['vx-pressable', props.className]}
		style={props.style}
		role="button"
		onClick={props.disabled ? undefined : props.onPress}
	>
		{props.children}
	</div>
}
