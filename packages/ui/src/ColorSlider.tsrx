/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useCallback, useEffect, useRef } from 'octane'
import type { ColorSliderProps, PanEvent } from './props'
import type { ColorSliderViewProps } from './internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from './useMeasure'
import { usePan } from './pan'
import { applyNativeProps } from './platformProps'
import { nativeAccessibilityRole } from './escape-props'
import { LinearGradient } from './LinearGradient'
import { hsbToHex, type Hsb } from './color'
import { useColorState } from './color-state'

const THUMB = 20

const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']

/** Internal hue slider view — 7-stop rainbow track, thumb filled with the
 *  current hue. Drag adjusts hue by delta (no tap-to-position v1). */
export function ColorSliderView(props: ColorSliderViewProps) @{
	const measure = useMeasure()
	const drag = useRef<number | null>(null)
	const host = useRef<any>(null)
	const lastTarget = useRef<any>(null)
	const adjust = (dir: number) => {
		if (props.isDisabled) {
			return
		}

		props.onHsb({ ...props.hsb, h: Math.min(360, Math.max(0, hue + dir * 10)) })
		props.onHsbEnd()
	}

	const adjustRef = useRef((dir: number) => {
		void dir
	})

	adjustRef.current = adjust
	const bindHost = useCallback((el: any) => {
		host.current = el
		measure.ref(el)
		if (el) {
			el.on?.('accessibilityIncrement', () => adjustRef.current(1))
			el.on?.('accessibilityDecrement', () => adjustRef.current(-1))
		}
	}, [])

	// Prefer measured bounds; fall back to the gesture target's own size —
	// the same source controls.macos uses, and it keeps pan working before
	// the first layoutChanged arrives.
	const targetSize = () => {
		const size = lastTarget.current?.getActualSize?.()
		return size && size.width > 0 ? size : measure.bounds
	}

	const w = measure.bounds?.width ?? 0
	const hue = props.hsb.h

	const onPan = usePan((e: PanEvent) => {
		if (props.isDisabled) {
			return
		}

		if (e.state === 'began') {
			lastTarget.current = e.target
			drag.current = hue
			return
		}

		if (e.state === 'moved') {
			const size = targetSize()
			if (drag.current == null || !size || !(size.width > 0)) {
				return
			}

			const h = Math.min(360, Math.max(0, drag.current + (e.dx / size.width) * 360))
			props.onHsb({ ...props.hsb, h })
		} else {
			if (drag.current != null) {
				props.onHsbEnd()
			}

			drag.current = null
		}
	})

	useEffect(() => {
		applyNativeProps(host.current, props)
	})

	const thumbX = Math.min(Math.max((hue / 360) * w - THUMB / 2, 0), Math.max(w - THUMB, 0))

	<masonview
		id={props.id}
		testID={props.testID}
		className={cx('vx-color-slider', props.className)}
		style={mergeStyle({ display: 'grid', height: 24 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'hue'}
		accessibilityValue={`hue ${Math.round(hue)}°`}
		onPan={onPan}
		ref={bindHost}
	>
		<LinearGradient
			colors={HUE_STOPS}
			direction="horizontal"
			className="vx-color-slider-track"
			style={{
				display: 'flex',
				position: 'absolute',
				left: 0,
				top: 0,
				width: '100%',
				height: '100%',
			}}
		/>
		<masonview
			className="vx-color-slider-thumb"
			style={mergeStyle(
				{ display: 'flex' },
				{
					width: THUMB,
					height: THUMB,
					borderRadius: THUMB / 2,
					borderWidth: 2,
					borderColor: '#ffffff',
					backgroundColor: hsbToHex({ h: hue, s: 1, b: 1 }),
					translateX: thumbX,
					translateY: 2,
					position: 'absolute',
				},
			)}
		/>
	</masonview>
}

export function ColorSlider(props: ColorSliderProps) @{
	const color = useColorState(props, '#ff0000')

	<ColorSliderView
		hsb={color.hsb}
		onHsb={color.set}
		onHsbEnd={color.end}
		isDisabled={props.isDisabled}
		id={props.id}
		testID={props.testID}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	/>
}
