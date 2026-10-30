/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useEffect, useRef } from 'octane'
import type { StatusDotProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole } from '../overlays/escape-props'
import { useColorScheme } from '../../theme/colorScheme'
import { statusDotColor } from '../../theme/scheme-colors'
import { nativeColor } from '../../theme/native-color'
import { isRenderable } from '../../internal/rendering/is-renderable'
import { Tooltip } from '../overlays/Tooltip'

/** StatusDot — an 8pt colored status signal. `label` is the dot's accessible
 *  name. `isPulsing` loops an opacity animation on the native view (no CSS
 *  keyframes in the NS engine). `tooltip` wraps the shared Tooltip — a no-op
 *  on touch targets by Tooltip's own contract. */
export function StatusDot(props: StatusDotProps): unknown @{
	const scheme = useColorScheme()
	const dot = useRef<any>(null)
	const pulsing = props.isPulsing ?? false

	useEffect(() => {
		const view = dot.current
		if (!pulsing || !view) {
			return
		}

		let cancelled = false
		const beat = (opacity: number) => {
			if (cancelled || !dot.current) {
				return
			}

			const done = () => {
				if (!cancelled) {
					beat(opacity === 1 ? 0.4 : 1)
				}
			}

			const result = view.animate?.({ opacity, duration: 750, curve: 'easeInOut' })
			if (result?.then) {
				result.then(done, done)
			} else {
				done()
			}
		}

		beat(0.4)

		return () => {
			cancelled = true
			view.cancelAnimation?.('opacity')
			view.opacity = 1
		}
	}, [pulsing])

	const showsIcon = isRenderable(props.icon)

	const view = (
		<masonview
			ref={(v: any) => {
				dot.current = v
				applyEscapeProps(v, props)
			}}
			id={props.id}
			className={cx('vx-statusdot', `vx-statusdot--${props.variant}`, props.className)}
			style={mergeStyle(
				{ display: 'flex' },
				{
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: nativeColor(statusDotColor(props.variant, scheme)),
					...styleRecord(props.style),
				},
			)}
			accessible={true}
			accessibilityRole={nativeAccessibilityRole('image')}
			accessibilityLabel={props.label}
		>
			{showsIcon ? props.icon : null}
		</masonview>
	)

	return props.tooltip != null ? <Tooltip trigger={view} content={props.tooltip} /> : view
}
