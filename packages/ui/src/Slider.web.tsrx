import type { SliderProps } from './props';
import { applyWebProps } from './platformProps.web';

export function Slider(props: SliderProps) @{
	<input
		id={props.id}
		type="range"
		className={['vx-slider', props.className]}
		style={props.style}
		value={props.value}
		min={props.minValue ?? 0}
		max={props.maxValue ?? 100}
		disabled={props.disabled}
		onInput={(e: any) => props.onValueChange?.(Number(e.target.value))}
		ref={(el: any) => applyWebProps(el, props.web)}
	/>
}
