import type { SwitchProps } from "./props";
import { applyEscapeProps } from "./escape-props";
export function Switch(props: SwitchProps) @{
	<input
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		type="checkbox"
		className={['vx-switch', props.className]}
		style={props.style}
		checked={props.checked}
		onChange={(e: any) => props.onCheckedChange?.(e.target.checked)}
	/>
}
