export function Switch(props: {
	className?: any;
	style?: any;
	id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}) @{
	<input
		id={props.id}
		type="checkbox"
		className={['vx-switch', props.className]}
		style={props.style}
		checked={props.checked}
		onChange={(e: any) => props.onCheckedChange?.(e.target.checked)}
	/>
}
