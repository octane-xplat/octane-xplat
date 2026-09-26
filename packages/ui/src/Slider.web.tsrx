import { useRef, useState } from 'octane';
import type { PanEvent, SliderProps } from './props';
import { useMeasure } from './useMeasure.web.tsrx';
import { usePan } from './pan.web.tsrx';
import { applyWebProps } from './platformProps.web';

/** Self-drawn slider — track + fill + thumb in a relative host, identical
 *  pixels across targets. Drag anywhere on the widget adjusts value by
 *  delta (no jump-to-tap v1). The platform widget (UISlider/SeekBar)
 *  lives in `ui/ios` + `ui/android`. */
export function Slider(props: SliderProps) @{
	const host = useRef<HTMLElement | null>(null);
	const measure = useMeasure();
	const drag = useRef<{ value0: number } | null>(null);
	const [dragValue, setDragValue] = useState<number | null>(null);

	const min = props.minValue ?? 0;
	const max = props.maxValue ?? 100;
	const value = dragValue ?? props.value ?? min;
	const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
	const width = measure.bounds?.width ?? 0;

	usePan(host, (e: PanEvent) => {
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

	<div
		id={props.id}
		role="slider"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-disabled={props.disabled ? true : undefined}
		className={['vx-slider', props.className]}
		style={props.style}
		ref={(el: any) => {
			host.current = el;
			measure.bind(el);
			applyWebProps(el, props.web);
		}}
	>
		<div className="vx-slider-track" aria-hidden="true" />
		<div className="vx-slider-fill" style={{ width: ratio * width }} aria-hidden="true" />
		<div className="vx-slider-thumb" style={{ left: ratio * width }} aria-hidden="true" />
	</div>
}
