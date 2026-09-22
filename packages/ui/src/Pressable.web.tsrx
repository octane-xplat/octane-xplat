export function Pressable(props: {
  className?: any;
  style?: any;
  disabled?: boolean;
  onPress?: () => void;
  children?: any;
  id?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}) @{
	<div
		id={props.id}
		className={['vx-pressable', props.className]}
		style={props.style}
		role={props.accessibilityRole ?? 'button'}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		onClick={props.disabled ? undefined : props.onPress}
	>
		{props.children}
	</div>
}
