/** @jsxImportSource @nativescript-community/octane */
import type { SliderProps } from '../props';
import { cx } from '../cx';
import { applyNativeProps } from '../platformProps.native';

/** SeekBar — the platform widget (Android SeekBar via NativeScript
 *  `slider`). The self-drawn shared `Slider` lives in the root export. */
export function SeekBar(props: SliderProps) @{
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
