/** @jsxImportSource @nativescript-community/octane */
import { useRef, useState } from 'octane';
import type { PanEvent, SliderProps } from './props';
import { cx } from './cx';
import { useMeasure } from './useMeasure.native.tsrx';
import { usePan } from './pan.native.tsrx';
import { applyNativeProps } from './platformProps.native';
import { nativeAccessibilityRole } from './escape-props';

/** Self-drawn slider — grid host with track + fill + thumb, identical
 *  pixels across targets. Drag anywhere on the widget adjusts value by
 *  delta (no jump-to-tap v1). The platform widget (UISlider/SeekBar)
 *  lives in `ui/ios` + `ui/android`. */
export function Slider(props: SliderProps) @{
	const measure = useMeasure();
	const drag = useRef<{ value0: number } | null>(null);
	const [dragValue, setDragValue] = useState<number | null>(null);

	const min = props.minValue ?? 0;
	const max = props.maxValue ?? 100;
	const value = dragValue ?? props.value ?? min;
	const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
	const width = measure.bounds?.width ?? 0;

	const onPan = usePan((e: PanEvent) => {
		if (props.disabled) return;
		if (e.state === 'began') {
			drag.current = { value0: value };
			return;
		}

		if (!drag.current || !width) return;
		if (e.state === 'moved') {
			const next = Math.min(max, Math.max(min, drag.current.value0 + (e.dx / width) * (max - min)));
			setDragValue(next);
			props.onValueChange?.(next);
		} else {
			drag.current = null;
			setDragValue(null);
		}
	});

	<gridlayout
		id={props.id}
		className={cx('vx-slider', props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('adjustable') as any}
		onPan={onPan}
		ref={(el: any) => {
			measure.bind(el);
			applyNativeProps(el, props);
		}}
	>
		<flexboxlayout className="vx-slider-track" />
		<flexboxlayout className="vx-slider-fill" horizontalAlignment="left" style={{ width: ratio * width }} />
		<flexboxlayout
			className="vx-slider-thumb"
			horizontalAlignment="left"
			style={{ marginLeft: Math.min(Math.max(ratio * width - 10, 0), Math.max(width - 20, 0)) }}
		/>
	</gridlayout>
}
