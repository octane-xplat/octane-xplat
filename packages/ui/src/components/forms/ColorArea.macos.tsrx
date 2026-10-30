/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useCallback, useRef } from 'octane'
import type { ColorAreaProps, PanEvent } from '../../props'
import type { ColorAreaViewProps } from '../../internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from '../layout/useMeasure'
import { usePan } from '../layout/pan'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { nativeAccessibilityRole } from '../overlays/escape-props'
import { LinearGradient } from '../media/LinearGradient'
import { clampHsb, hsbToHex, type Hsb } from '../../theme/color'
import { useColorState } from '../../theme/color-state'

const THUMB = 16

/** Internal 2D area view — saturation left→right, brightness top→bottom.
 *  Drag is delta-based (no tap-to-position v1); arrows step 0.01 (Shift 0.1)
 *  on the matching channel, assistive increment/decrement steps brightness
 *  by 0.05. */
export function ColorAreaView(props: ColorAreaViewProps): unknown @{
	const measure = useMeasure()
	const drag = useRef<Hsb | null>(null)
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
	const h = measure.bounds?.height ?? 0
	const { s, b } = props.hsb

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
			drag.current = { ...props.hsb }
			focusHost()
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

	const adjust = (dir: number) => move({ b: latest.current.hsb.b + dir * 0.05 })

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
			move({ s: current.hsb.s + ds, b: current.hsb.b + db })
		},
	})

	const thumbX = Math.min(Math.max(s * w - THUMB / 2, 0), Math.max(w - THUMB, 0))
	const thumbY = Math.min(Math.max((1 - b) * h - THUMB / 2, 0), Math.max(h - THUMB, 0))

	<masonview
		id={props.id}
		className={cx('vx-color-area', props.className)}
		style={mergeStyle({ display: 'grid', height: 160 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'color'}
		accessibilityValue={String(Math.round(b * 100))}
		accessibilityMinValue={0}
		accessibilityMaxValue={100}
		accessibilityValueDescription={`saturation ${Math.round(s * 100)}%, brightness ${Math.round(b * 100)}%`}
		accessibilityState={{ disabled: Boolean(props.isDisabled) }}
		disabled={props.isDisabled}
		{...keyboardProps}
		onTap={focusHost}
		onAccessibilityIncrement={props.isDisabled ? undefined : () => adjust(1)}
		onAccessibilityDecrement={props.isDisabled ? undefined : () => adjust(-1)}
		onPan={onPan}
		ref={bindHost}
	>
		<masonview
			style={mergeStyle(
				{ display: 'flex' },
				{
					backgroundColor: hsbToHex({ h: props.hsb.h, s: 1, b: 1 }),
					position: 'absolute',
					left: 0,
					top: 0,
					width: '100%',
					height: '100%',
				},
			)}
		/>
		<LinearGradient
			colors={['#ffffff', 'rgba(255,255,255,0)']}
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
		<LinearGradient
			colors={['rgba(0,0,0,0)', '#000000']}
			direction="vertical"
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
					backgroundColor: hsbToHex(props.hsb),
					left: thumbX,
					top: thumbY,
					position: 'absolute',
				},
			)}
		/>
	</masonview>
}

export function ColorArea(props: ColorAreaProps): unknown @{
	const color = useColorState(props, '#ff0000')

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
}
