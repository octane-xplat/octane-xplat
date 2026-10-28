/** @jsxImportSource @octane-xplat/jsx/dom */
import { useRef } from 'octane'
import type { ColorAreaProps, PanEvent } from './props'
import type { ColorAreaViewProps } from './internal-props'
import { useMeasure } from './useMeasure.web.tsrx'
import { usePan } from './pan.web.tsrx'
import { applyWebProps } from './platformProps.web'
import { LinearGradient } from './LinearGradient'
import { hsbToHex, type Hsb } from './color'
import { useColorState } from './color-state'

const THUMB = 16

/** Internal 2D area view — saturation left→right, brightness top→bottom.
 *  Drag is delta-based from the value at pointerdown (no tap-to-position v1). */
export function ColorAreaView(props: ColorAreaViewProps) {
	const host = useRef<HTMLElement | null>(null)
	const measure = useMeasure()
	const drag = useRef<Hsb | null>(null)

	const w = measure.bounds?.width ?? 0
	const h = measure.bounds?.height ?? 0
	const { s, b } = props.hsb

	const onKeyDown = (event: KeyboardEvent) => {
		if (props.isDisabled || event.defaultPrevented) {
			return
		}

		const step = event.shiftKey ? 0.1 : 0.01
		let ds = 0,
			db = 0

		switch (event.key) {
			case 'ArrowRight':
				ds = step
				break
			case 'ArrowLeft':
				ds = -step
				break
			case 'ArrowUp':
				db = step
				break
			case 'ArrowDown':
				db = -step
				break
			default:
				return
		}

		event.preventDefault()
		props.onHsb({
			h: props.hsb.h,
			s: Math.min(1, Math.max(0, s + ds)),
			b: Math.min(1, Math.max(0, b + db)),
		})

		props.onHsbEnd()
	}

	usePan(host, (e: PanEvent) => {
		if (props.isDisabled) {
			return
		}

		if (e.state === 'began') {
			drag.current = { ...props.hsb }
			return
		}

		if (e.state === 'moved') {
			if (!drag.current || !w || !h) {
				return
			}

			props.onHsb({
				h: props.hsb.h,
				s: Math.min(1, Math.max(0, drag.current.s + e.dx / w)),
				b: Math.min(1, Math.max(0, drag.current.b - e.dy / h)),
			})
		} else {
			if (drag.current) {
				props.onHsbEnd()
			}

			drag.current = null
		}
	})

	const thumbX = Math.min(Math.max(s * w, 0), Math.max(w, 0))
	const thumbY = Math.min(Math.max((1 - b) * h, 0), Math.max(h, 0))

	return (
		<div
			id={props.id}
			data-testid={props.testID}
			role="slider"
			tabIndex={props.isDisabled ? -1 : 0}
			onKeyDown={onKeyDown}
			aria-valuetext={`saturation ${Math.round(s * 100)}%, brightness ${Math.round(b * 100)}%`}
			aria-label={props.accessibilityLabel ?? 'color'}
			aria-disabled={props.isDisabled ? true : undefined}
			className={['vx-color-area', props.className]}
			style={{
				height: 160,
				...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
			}}
			ref={(el: any) => {
				host.current = el
				measure.ref(el)
				applyWebProps(el, props.web as Record<string, any> | undefined)
			}}
		>
			<div
				className="vx-color-area-hue"
				aria-hidden="true"
				style={{ backgroundColor: hsbToHex({ h: props.hsb.h, s: 1, b: 1 }) }}
			/>
			<LinearGradient
				colors={['#ffffff', 'rgba(255,255,255,0)']}
				direction="horizontal"
				className="vx-color-area-sat"
			/>
			<LinearGradient
				colors={['rgba(0,0,0,0)', '#000000']}
				direction="vertical"
				className="vx-color-area-val"
			/>
			<div
				className="vx-color-area-thumb"
				aria-hidden="true"
				style={{
					left: thumbX,
					top: thumbY,
					backgroundColor: hsbToHex(props.hsb),
				}}
			/>
		</div>
	)
}

export function ColorArea(props: ColorAreaProps) {
	const color = useColorState(props, '#ff0000')
	return (
		<ColorAreaView
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
