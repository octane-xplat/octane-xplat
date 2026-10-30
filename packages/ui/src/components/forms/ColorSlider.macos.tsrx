/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useCallback, useRef } from 'octane'
import type { ColorSliderProps, PanEvent } from '../../props'
import type { ColorSliderViewProps } from '../../internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from '../layout/useMeasure'
import { usePan } from '../layout/pan'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { nativeAccessibilityRole } from '../overlays/escape-props'
import { LinearGradient } from '../media/LinearGradient'
import { clampHsb, hsbToHex, type Hsb } from '../../theme/color'
import { useColorState } from '../../theme/color-state'

const THUMB = 20
const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']

/** Internal hue slider — 7-stop track, thumb filled with the current hue.
 *  Drag is delta-based (no tap-to-position v1); arrows step 1° (Shift 10°),
 *  assistive increment/decrement steps 10°. */
export function ColorSliderView(props: ColorSliderViewProps) @{
	const measure = useMeasure()
	const drag = useRef<number | null>(null)
	const host = useRef<any>(null)
	const latest = useRef(props)
	latest.current = props
	// Stable ref identity: a fresh callback each render would rebind
	// useMeasure (null → el), reset bounds, and re-render forever.
	const bindHost = useCallback((el: any) => {
		host.current = el
		measure.ref(el)
	}, [])

	const w = measure.bounds?.width ?? 0
	const hue = props.hsb.h

	const focusHost = () => {
		const target = host.current
		if (target && !latest.current.isDisabled) {
			target.window?.makeFirstResponder(target)
		}
	}

	const onPan = usePan((e: PanEvent) => {
		if (props.isDisabled) {
			return
		}

		if (e.state === 'began') {
			drag.current = hue
			focusHost()
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

	// Committed adjustment shared by arrow keys and assistive actions — reads
	// the latest props so retained handlers never replay a stale hsb.
	const move = (next: Partial<Hsb>) => {
		const current = latest.current
		if (current.isDisabled) {
			return
		}

		current.onHsb(clampHsb({ ...current.hsb, ...next }))
		current.onHsbEnd()
	}

	const adjust = (dir: number) => move({ h: latest.current.hsb.h + dir * 10 })

	const { keyboardProps } = useKeyboard({
		onKeyDown: (event) => {
			const current = latest.current
			if (
				current.isDisabled ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey
			) {
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
			move({ h: current.hsb.h + d })
		},
	})

	const thumbX = Math.min(Math.max((hue / 360) * w - THUMB / 2, 0), Math.max(w - THUMB, 0))

	<masonview
		id={props.id}
		className={cx('vx-color-slider', props.className)}
		style={mergeStyle({ display: 'grid', height: 24 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'hue'}
		accessibilityValue={String(Math.round(hue))}
		accessibilityMinValue={0}
		accessibilityMaxValue={360}
		accessibilityValueDescription={`hue ${Math.round(hue)}°`}
		accessibilityState={{ disabled: Boolean(props.isDisabled) }}
		disabled={props.isDisabled}
		{...keyboardProps}
		onTap={focusHost}
		onAccessibilityIncrement={props.isDisabled ? undefined : () => adjust(1)}
		onAccessibilityDecrement={props.isDisabled ? undefined : () => adjust(-1)}
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
