import type { SwitchProps } from "./props";
export function Switch(props: SwitchProps) @{
	<input
		id={props.id}
		type="checkbox"
		className={['vx-switch', props.className]}
		style={props.style}
		checked={props.checked}
		onChange={(e: any) => props.onCheckedChange?.(e.target.checked)}
	/>
}
