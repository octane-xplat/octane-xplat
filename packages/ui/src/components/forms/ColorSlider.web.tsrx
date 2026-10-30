/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useRef } from 'octane'
import type { ColorSliderProps, PanEvent } from '../../props'
import type { ColorSliderViewProps } from '../../internal-props'
import { useMeasure } from '../layout/useMeasure.web.tsrx'
import { usePan } from '../layout/pan.web.tsrx'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { LinearGradient } from '../media/LinearGradient'
import { hsbToHex } from '../../theme/color'
import { useColorState } from '../../theme/color-state'

const THUMB = 20
const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']

/** Internal hue slider — 7-stop track, thumb filled with the current hue.
 *  Drag is delta-based (no tap-to-position v1); arrows step 1°, Shift 10°. */
export function ColorSliderView(props: ColorSliderViewProps): JSX.Element {
	const host = useRef<HTMLElement | null>(null)
	const measure = useMeasure()
	const drag = useRef<number | null>(null)

	const w = measure.bounds?.width ?? 0
	const hue = props.hsb.h

	const onKeyDown = (event: KeyboardEvent) => {
		if (props.isDisabled || event.defaultPrevented) {
			return
		}

		const step = event.shiftKey ? 10 : 1
		let d = 0
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				d = step
				break
			case 'ArrowLeft':
			case 'ArrowDown':
				d = -step
				break
			default:
				return
		}

		event.preventDefault()
		props.onHsb({ ...props.hsb, h: Math.min(360, Math.max(0, hue + d)) })
		props.onHsbEnd()
	}

	usePan(host, (e: PanEvent) => {
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

	const thumbX = Math.min(Math.max((hue / 360) * w, 0), Math.max(w, 0))

	return (
		<div
			id={props.id}
			data-testid={props.testID}
			role="slider"
			tabIndex={props.isDisabled ? -1 : 0}
			onKeyDown={onKeyDown}
			aria-valuemin={0}
			aria-valuemax={360}
			aria-valuenow={Math.round(hue)}
			aria-valuetext={`hue ${Math.round(hue)}°`}
			aria-label={props.accessibilityLabel ?? 'hue'}
			aria-disabled={props.isDisabled ? true : undefined}
			className={['vx-color-slider', props.className]}
			style={{
				height: 24,
				...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
			}}
			ref={(el: any) => {
				host.current = el
				measure.ref(el)
				applyWebProps(el, props.web as Record<string, any> | undefined)
			}}
		>
			<LinearGradient colors={HUE_STOPS} direction="horizontal" className="vx-color-slider-track" />
			<div
				className="vx-color-slider-thumb"
				aria-hidden="true"
				style={{
					left: thumbX,
					backgroundColor: hsbToHex({ h: hue, s: 1, b: 1 }),
				}}
			/>
		</div>
	)
}

export function ColorSlider(props: ColorSliderProps): JSX.Element {
	const color = useColorState(props, '#ff0000')
	return (
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
	)
}
