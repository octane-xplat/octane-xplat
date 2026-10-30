/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { PanEvent, SliderProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from '../layout/useMeasure'
import { usePan } from '../layout/pan'
import { applyNativeProps } from '../../internal/platform/platformProps'
import { nativeAccessibilityRole } from '../overlays/escape-props'

/** Self-drawn slider — grid host with track + fill + thumb, identical
 *  pixels across targets. Drag anywhere on the widget adjusts value by
 *  delta (no jump-to-tap v1). The platform widget (UISlider/SeekBar)
 *  lives in `ui/ios` + `ui/android`. */
export function Slider(props: SliderProps): unknown @{
	const measure = useMeasure()
	const drag = useRef<{ value0: number } | null>(null)
	const [dragValue, setDragValue] = useState<number | null>(null)

	const min = props.min ?? props.minValue ?? 0
	const max = props.max ?? props.maxValue ?? 100
	const raw = props.value
	const value = dragValue ?? (Array.isArray(raw) ? raw[1] : raw) ?? min
	const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)))
	const width = measure.bounds?.width ?? 0

	// Keep one ref identity so native measurement listeners stay attached to
	// the same host across rerenders.
	const host = useRef<any>(null)
	const bindHost = useCallback((el: any) => {
		host.current = el
		measure.ref(el)
	}, [])

	const trackHeight = 4
	const thumbSize = 20
	const trackTop = (28 - trackHeight) / 2
	const thumbTop = (28 - thumbSize) / 2
	const thumbLeft = Math.min(
		Math.max(ratio * width - thumbSize / 2, 0),
		Math.max(width - thumbSize, 0),
	)

	useEffect(() => {
		applyNativeProps(host.current, props)
	})

	const onPan = usePan((e: PanEvent) => {
		if (props.disabled) {
			return
		}

		if (e.state === 'began') {
			drag.current = { value0: value }
			return
		}

		if (!drag.current || !width) {
			return
		}

		if (e.state === 'moved') {
			const next = Math.min(max, Math.max(min, drag.current.value0 + (e.dx / width) * (max - min)))
			setDragValue(next)
			props.onValueChange?.(next)
		} else {
			drag.current = null
			setDragValue(null)
		}
	})

	<masonview
		id={props.id}
		className={cx('vx-slider', props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		onPan={onPan}
		ref={bindHost}
	>
		<masonview
			className="vx-slider-track"
			style={mergeStyle({ display: 'flex' }, { width, translateY: trackTop, position: 'absolute' })}
		/>
		<masonview
			className="vx-slider-fill"
			style={mergeStyle(
				{ display: 'flex' },
				{ width: ratio * width, translateY: trackTop, position: 'absolute' },
			)}
		/>
		<masonview
			className="vx-slider-thumb"
			style={mergeStyle(
				{ display: 'flex' },
				{ translateX: thumbLeft, translateY: thumbTop, position: 'absolute' },
			)}
		/>
	</masonview>
}
