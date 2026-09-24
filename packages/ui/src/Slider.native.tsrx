/** @jsxImportSource @nativescript-community/octane */
import type { SliderProps } from './props';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';

export function Slider(props: SliderProps) @{
	<slider
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		value={props.value}
		minValue={props.minValue ?? 0}
		maxValue={props.maxValue ?? 100}
		isEnabled={props.disabled ? false : true}
		onValueChange={(e: any) => props.onValueChange?.(e.value)}
		ref={(el: any) => applyNativeProps(el, props)}
	/>
}
