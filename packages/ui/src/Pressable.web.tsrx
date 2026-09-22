export function Pressable(props: {
  className?: unknown;
  style?: unknown;
  disabled?: boolean;
  onPress?: () => void;
  children?: unknown;
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
