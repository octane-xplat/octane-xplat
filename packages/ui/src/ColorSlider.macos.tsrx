/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useCallback, useRef } from 'octane'
import type { ColorSliderProps, PanEvent } from './props'
import type { ColorSliderViewProps } from './internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from './useMeasure'
import { usePan } from './pan'
import { nativeAccessibilityRole } from './escape-props'
import { LinearGradient } from './LinearGradient'
import { hsbToHex } from './color'
import { useColorState } from './color-state'

const THUMB = 20
const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']

/** Internal hue slider — 7-stop track, thumb filled with the current hue.
 *  Drag is delta-based (no tap-to-position v1); a11y adjust steps 10°. */
export function ColorSliderView(props: ColorSliderViewProps) @{
	const measure = useMeasure()
	const drag = useRef<number | null>(null)
	const host = useRef<any>(null)
	// Stable ref identity: a fresh callback each render would rebind
	// useMeasure (null → el), reset bounds, and re-render forever.
	const bindHost = useCallback((el: any) => {
		host.current = el
		measure.ref(el)
	}, [])

	const w = measure.bounds?.width ?? 0
	const hue = props.hsb.h

	const onPan = usePan((e: PanEvent) => {
		if (props.isDisabled) {
			return
		}

		if (e.state === 'began') {
			drag.current = hue
			return
		}

		if (e.state === 'moved') {
			if (drag.current == null || !w) {
				return
			}

			props.onHsb({ ...props.hsb, h: Math.min(360, Math.max(0, drag.current + (e.dx / w) * 360)) })
		} else {
			if (drag.current != null) {
				props.onHsbEnd()
			}

			drag.current = null
		}
	})

	const adjust = (dir: number) => {
		if (props.isDisabled) {
			return
		}

		props.onHsb({ ...props.hsb, h: Math.min(360, Math.max(0, hue + dir * 10)) })
		props.onHsbEnd()
	}

	const thumbX = Math.min(Math.max((hue / 360) * w - THUMB / 2, 0), Math.max(w - THUMB, 0))

	<masonview
		id={props.id}
		className={cx('vx-color-slider', props.className)}
		style={mergeStyle({ display: 'grid', height: 24 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'hue'}
		onPan={onPan}
		ref={bindHost}
	>
		<LinearGradient
			colors={HUE_STOPS}
			direction="horizontal"
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
			style={mergeStyle(
				{ display: 'flex' },
				{
					width: THUMB,
					height: THUMB,
					borderRadius: THUMB / 2,
					borderWidth: 2,
					borderColor: '#ffffff',
					backgroundColor: hsbToHex({ h: hue, s: 1, b: 1 }),
					left: thumbX,
					top: 2,
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
