/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle, styleRecord } from './style-merge'
import { useCallback, useRef } from 'octane'
import type { ColorAreaProps, PanEvent } from './props'
import type { ColorAreaViewProps } from './internal-props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from './useMeasure'
import { usePan } from './pan'
import { nativeAccessibilityRole } from './escape-props'
import { LinearGradient } from './LinearGradient'
import { hsbToHex, type Hsb } from './color'
import { useColorState } from './color-state'

const THUMB = 16

/** Internal 2D area view — saturation left→right, brightness top→bottom.
 *  Drag is delta-based (no tap-to-position v1); a11y adjust steps brightness. */
export function ColorAreaView(props: ColorAreaViewProps) @{
	const measure = useMeasure()
	const drag = useRef<Hsb | null>(null)
	const host = useRef<any>(null)
	// Stable ref identity: a fresh callback each render would rebind
	// useMeasure (null → el), reset bounds, and re-render forever.
	const bindHost = useCallback((el: any) => {
		host.current = el
		measure.ref(el)
	}, [])

	const w = measure.bounds?.width ?? 0
	const h = measure.bounds?.height ?? 0
	const { s, b } = props.hsb

	const onPan = usePan((e: PanEvent) => {
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

	const adjust = (dir: number) => {
		if (props.isDisabled) {
			return
		}

		props.onHsb({ ...props.hsb, b: Math.min(1, Math.max(0, b + dir * 0.05)) })
		props.onHsbEnd()
	}

	const thumbX = Math.min(Math.max(s * w - THUMB / 2, 0), Math.max(w - THUMB, 0))
	const thumbY = Math.min(Math.max((1 - b) * h - THUMB / 2, 0), Math.max(h - THUMB, 0))

	<masonview
		id={props.id}
		className={cx('vx-color-area', props.className)}
		style={mergeStyle({ display: 'grid', height: 160 }, styleRecord(props.style))}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.accessibilityLabel ?? 'color'}
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
