/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import { useCallback, useEffect, useRef } from 'octane'
import type { ColorAreaProps, PanEvent } from './props'
import type { ColorAreaViewProps } from './internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from './useMeasure'
import { usePan } from './pan'
import { applyNativeProps } from './platformProps'
import { nativeAccessibilityRole } from './escape-props'
import { LinearGradient } from './LinearGradient'
import { hsbToHex, type Hsb } from './color'
import { useColorState } from './color-state'

const THUMB = 16

/** Internal 2D area view — saturation left→right, brightness top→bottom.
 *  Drag adjusts by delta from the value at `began` (no tap-to-position v1). */
export function ColorAreaView(props: ColorAreaViewProps) @{
	const measure = useMeasure()
	const drag = useRef<Hsb | null>(null)
	const host = useRef<any>(null)
	const lastTarget = useRef<any>(null)
	const adjust = (dir: number) => {
		if (props.isDisabled) {
			return
		}

		props.onHsb({ ...props.hsb, b: Math.min(1, Math.max(0, props.hsb.b + dir * 0.05)) })
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
	const h = measure.bounds?.height ?? 0
	const { s, b } = props.hsb

	const onPan = usePan((e: PanEvent) => {
		if (props.isDisabled) {
			return
		}

		if (e.state === 'began') {
			lastTarget.current = e.target
			drag.current = { ...props.hsb }
			return
		}

		if (e.state === 'moved') {
			const size = targetSize()
			const next =
				size && size.width > 0 && size.height > 0 && drag.current
					? {
							h: props.hsb.h,
							s: Math.min(1, Math.max(0, drag.current.s + e.dx / size.width)),
							b: Math.min(1, Math.max(0, drag.current.b - e.dy / size.height)),
						}
					: null

			if (next) {
				props.onHsb(next)
			}
		} else {
			if (drag.current) {
				props.onHsbEnd()
			}

			drag.current = null
		}
	})

	useEffect(() => {
		applyNativeProps(host.current, props)
	})

	const thumbX = Math.min(Math.max(s * w - THUMB / 2, 0), Math.max(w - THUMB, 0))
	const thumbY = Math.min(Math.max((1 - b) * h - THUMB / 2, 0), Math.max(h - THUMB, 0))

	<masonview
		id={props.id}
		testID={props.testID}
		className={cx('vx-color-area', props.className)}
		style={mergeStyle({ display: 'grid', height: 160 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'color'}
		accessibilityValue={`saturation ${Math.round(s * 100)}%, brightness ${Math.round(b * 100)}%`}
		onPan={onPan}
		ref={bindHost}
	>
		<masonview
			className="vx-color-area-hue"
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
			className="vx-color-area-sat"
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
			className="vx-color-area-val"
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
			className="vx-color-area-thumb"
			style={mergeStyle(
				{ display: 'flex' },
				{
					width: THUMB,
					height: THUMB,
					borderRadius: THUMB / 2,
					borderWidth: 2,
					borderColor: '#ffffff',
					backgroundColor: hsbToHex(props.hsb),
					translateX: thumbX,
					translateY: thumbY,
					position: 'absolute',
				},
			)}
		/>
	</masonview>
}

export function ColorArea(props: ColorAreaProps) @{
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
