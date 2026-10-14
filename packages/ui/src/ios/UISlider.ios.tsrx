/** @jsxImportSource @nativescript-community/octane */
import type { UISliderProps } from '../props';
import { cx } from '@octane-xplat/lib';
import { applyNativeProps } from '../platformProps';

/** UISlider — the platform widget (UIKit UISlider via NativeScript `slider`).
 *  The self-drawn shared `Slider` lives in the root export. */
export function UISlider(props: UISliderProps) @{
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
